import extract_issues from "#client/extract-issues";
import type { Dict } from "@rcompat/type";
import type { Issue, JSONPayload } from "pema";

type FormId = string;

type FieldErrors = readonly string[];

type FormErrors = {
  form: FieldErrors;
  fields: Dict<FieldErrors>;
};

type FormSnapshot = {
  id: FormId;
  submitting: boolean;
  errors: FormErrors;
};

export type FormView = FormSnapshot & {
  submit: (event?: Event) => Promise<void>;
};

type FormSubscriber = (snapshot: FormSnapshot) => void;

export type FormInit = {
  id?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  url?: string;
  headers?: Dict<string>;
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

export default function createForm(init: FormInit): FormController {
  const id = init.id ?? `form-${crypto.randomUUID()}`;

  let snapshot: FormSnapshot = {
    id,
    submitting: false,
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
    const byField: Dict<string[]> = {};
    const formErrors: string[] = [];

    for (const issue of issues) {
      const path = (issue as any).path as string | undefined;

      // no path or empty string -> form-level error
      if (!path) {
        formErrors.push(issue.message);
        continue;
      }

      const key = pointer_to_fieldname(path);

      // if normalizes to empty (e.g. "/"), treat as form-level
      if (!key) {
        formErrors.push(issue.message);
        continue;
      }

      (byField[key] ??= []).push(issue.message);
    }

    snapshot = {
      ...snapshot,
      errors: {
        form: formErrors,
        fields: byField,
      },
    };
    publish();
  }

  async function submit(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const form_element =
      (event?.currentTarget as HTMLFormElement | null) ??
      (document.getElementById(id) as HTMLFormElement | null);

    // no form element
    if (!form_element) return;

    const method = init.method
      ?? form_element.method.toUpperCase() as FormInit["method"]
      ?? "POST";
    const url = init.url ?? form_element.action;
    const form_data = new FormData(form_element);

    setSubmitting(true);

    try {
      const response = await fetch(url, {
        method,
        body: form_data,
        headers: init.headers,
      });

      if (response.ok) {
        // on success: clear errors, let the app decide what to do next
        // (redirect/reload)
        snapshot = { ...snapshot, errors: { form: [], fields: {} } };
        publish();
        return;
      }

      const payload = await response.json() as JSONPayload;
      const issues = extract_issues(payload); // all issues, all paths
      setErrors(issues);
    } catch (error) {
      // network error
      setErrors([{ message: (error as Error).message, path: "" }]);
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
    submit,
    get id() {
      return snapshot.id;
    },
  };
}
