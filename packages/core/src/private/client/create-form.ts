import extract_issues from "#client/extract-issues";
import submit from "#client/submit";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import type { Issue, JSONPayload } from "pema";

type FormId = string;
type FieldErrors = string[];

type FormErrors = {
  form: FieldErrors;
  fields: Dict<FieldErrors>;
};

type FormSnapshot = {
  id: FormId;
  submitting: boolean;
  submitted: boolean;
  errors: FormErrors;
};

export type FormView = FormSnapshot & {
  submit: (event?: Event) => Promise<void>;
};

type FormSubscriber = (snapshot: FormSnapshot) => void;

export type MethodMeta = {
  contentType?: string;
};

export type ClientMethod<Values extends Dict = Dict> = MethodMeta &
  ((args: { body: Values }) => Promise<Response>);

export type FormInit = {
  id?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  url?: string;
  headers?: Dict<string>;
  action?: (args: { body: unknown }) => Promise<Response>;
  contentType?: string;
};

type FormController = {
  // reactive-like API for wrappers
  subscribe(fn: FormSubscriber): () => void;

  // sync read of current state
  read(): FormSnapshot;

  // submit DOM form
  submit(event?: Event): Promise<void>;

  get id(): FormId;
};

function decode_pointer_segment(segment: string) {
  // decode JSON Pointer: ~1 -> /, ~0 -> ~
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pointer_to_fieldname(path: string): string {
  // if server didn't send a pointer, assume it's already a field name
  if (!path.startsWith("/")) return path;

  // root pointer "" is handled before calling this
  // "/" is not a valid root pointer, but treat as form-level
  if (path === "/") return "";

  const segments = path.split("/").slice(1).map(decode_pointer_segment);

  if (segments.length === 0 || segments[0] === "") return "";

  let name = segments[0];
  for (let i = 1; i < segments.length; i++) {
    name += `[${segments[i]}]`;
  }
  return name;
}

function content_type_body(
  contentType: string | undefined,
  form_data: FormData,
): unknown {
  if (contentType === "application/json") return Object.fromEntries(form_data);
  if (contentType === "multipart/form-data") return form_data;
  // default: application/x-www-form-urlencoded
  return new URLSearchParams(form_data as unknown as Record<string, string>);
}

function form_data_body(form_data: FormData): FormData | URLSearchParams {
  for (const value of form_data.values()) {
    if (value instanceof File && value.size > 0) return form_data;
  }
  return new URLSearchParams(form_data as unknown as Record<string, string>);
}

export default function createForm(init: FormInit): FormController {
  const id = init.id ?? `form-${crypto.randomUUID()}`;

  let snapshot: FormSnapshot = {
    id,
    submitting: false,
    submitted: false,
    errors: { form: [], fields: {} },
  };

  const subscribers = new Set<FormSubscriber>();

  function publish() {
    for (const s of subscribers) s(snapshot);
  }

  function setSubmitting(submitting: boolean) {
    snapshot = { ...snapshot, submitting };
    publish();
  }

  function setErrors(issues: Issue[]) {
    const by_field: Dict<string[]> = {};
    const form_errors: string[] = [];

    for (const issue of issues) {
      const path = issue.path as string | undefined;

      // no path or empty string -> form-level error
      if (path === undefined) {
        form_errors.push(issue.message);
        continue;
      }

      const key = pointer_to_fieldname(path);

      // if normalizes to empty (e.g. "/"), treat as form-level
      if (key.length === 0) {
        form_errors.push(issue.message);
        continue;
      }

      (by_field[key] ??= []).push(issue.message);
    }

    snapshot = {
      ...snapshot,
      submitted: false,
      errors: {
        form: form_errors,
        fields: by_field,
      },
    };
    publish();
  }

  async function submit_form(event?: Event) {
    if (event !== undefined) {
      event.preventDefault();
      event.stopPropagation();
    }

    const form_element =
      (event?.currentTarget as HTMLFormElement | null) ??
      (document.getElementById(id) as HTMLFormElement | null);

    // no form element
    if (form_element === null) return;

    const method = init.method
      ?? form_element.method.toUpperCase() as FormInit["method"]
      ?? "POST";
    const url = init.url ?? form_element.action;
    const form_data = new FormData(form_element);

    setSubmitting(true);

    try {
      const response = await (is.defined(init.action)
        ? init.action({ body: content_type_body(init.contentType, form_data) })
        : submit(url, form_data_body(form_data), method)
      );

      if (response.ok) {
        // on success: clear errors, let the app decide what to do next
        // (redirect/reload)
        snapshot = { ...snapshot, submitted: true, errors: { form: [], fields: {} } };
        publish();
        return;
      }

      // all issues, all paths
      const issues = extract_issues(await response.json() as JSONPayload);
      setErrors(issues);
    } catch (error) {
      // network error
      setErrors([{ type: "network_error", message: (error as Error).message, path: "" }]);
    } finally {
      setSubmitting(false);
    }
  }

  function subscribe(fn: FormSubscriber) {
    subscribers.add(fn);
    fn(snapshot); // emit current
    return () => subscribers.delete(fn);
  }

  function read() {
    return snapshot;
  }

  return {
    subscribe,
    read,
    submit: submit_form,
    get id() {
      return snapshot.id;
    },
  };
}
