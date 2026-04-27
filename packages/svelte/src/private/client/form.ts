import type {
  ClientMethod,
  FormInit,
  FormView,
  MethodMeta
} from "@primate/core/client";
import client from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import type { Readable } from "svelte/store";
import { writable } from "svelte/store";

type SvelteFormView<Values extends Dict> = {
  id: string;
  submitting: boolean;
  submitted: boolean;
  submit: (event?: Event) => Promise<void>;
  errors: readonly string[];
  field: <K extends keyof Values & string>(name: K) => {
    name: string;
    value: Values[K];
    error: string | null;
    errors: readonly string[];
  };
};

type Initial<Values extends Dict> = FormInit & { initial?: Values };

function form<Values extends Dict>(
  action: ClientMethod<Values>,
  init?: Initial<Values>,
): Readable<SvelteFormView<Values>>;
function form<Values extends Dict>(
  init: Initial<Values>,
): Readable<SvelteFormView<Values>>;
function form(init?: FormInit): Readable<SvelteFormView<Dict>>;
function form<Values extends Dict = Dict>(
  action_or_init?: ClientMethod | Initial<Values>,
  maybe_init?: Initial<Values>,
) {
  const is_action = typeof action_or_init === "function";
  const { initial, ...form_init } = (
    is_action ? (maybe_init ?? {}) : (action_or_init ?? {})
  ) as Initial<Values>;
  const action = is_action ? action_or_init : undefined;
  const contentType = is_action
    ? (action_or_init as MethodMeta).contentType
    : undefined;
  const controller = client.createForm({
    ...form_init,
    ...(action !== undefined && {
      action: action as (args: { body: unknown }) => Promise<Response>,
      contentType,
    }),
  });
  const values = initial ?? {} as Values;
  const make_view = (snapshot: FormView): SvelteFormView<Values> => {
    const form_errors = snapshot.errors.form;
    return {
      id: snapshot.id,
      submitting: snapshot.submitting,
      submitted: snapshot.submitted,
      submit: controller.submit,
      errors: form_errors,
      field(name) {
        const key = name as string;
        const errors = snapshot.errors.fields[key] ?? [];
        return {
          name: key,
          value: values[name],
          error: errors[0] ?? null,
          errors,
        };
      },
    };
  };
  const initial_view = make_view({
    ...controller.read(),
    submit: controller.submit,
  });
  const { subscribe, set } = writable<SvelteFormView<Values>>(initial_view);
  controller.subscribe(snapshot => {
    set(make_view({
      ...snapshot,
      submit: controller.submit,
    }));
  });
  return { subscribe };
}

export default form;
