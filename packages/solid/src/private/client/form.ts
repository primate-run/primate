import type { ClientMethod, FormInit, MethodMeta } from "@primate/core/client";
import core from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import { createSignal, onCleanup } from "solid-js";

type FormView<Values extends Dict> = {
  id: string;
  submitting: boolean;
  submitted: boolean;
  submit: (event?: Event) => Promise<void>;
  errors: string[];
  field: <K extends keyof Values & string>(name: K) => {
    name: string;
    value: Values[K];
    error: string | null;
    errors: string[];
  };
};

type Initial<Values extends Dict> = FormInit & { initial?: Values };

function form<Values extends Dict>(
  action: ClientMethod<Values>,
  init?: Initial<Values>,
): FormView<Values>;
function form<Values extends Dict>(init: Initial<Values>): FormView<Values>;
function form(init?: FormInit): FormView<Dict>;

function form<Values extends Dict = Dict>(
  action_or_init?: ClientMethod | Initial<Values>,
  maybe_init?: Initial<Values>,
): FormView<Values> {
  const is_action = typeof action_or_init === "function";
  const { initial, ...form_init } = (
    is_action ? (maybe_init ?? {}) : (action_or_init ?? {})
  ) as Initial<Values>;

  const action = is_action ? action_or_init : undefined;
  const contentType = is_action
    ? (action_or_init as MethodMeta).contentType
    : undefined;

  const controller = core.createForm({
    ...form_init,
    ...action !== undefined && {
      action: action as (args: { body: unknown }) => Promise<Response>,
      contentType,
    },
  });
  const values = initial ?? {} as Values;
  const [snapshot, setSnapshot] = createSignal(controller.read());
  const unsubscribe = controller.subscribe(next => setSnapshot(next));
  onCleanup(unsubscribe);

  return {
    get id() {
      return snapshot().id;
    },

    get submitting() {
      return snapshot().submitting;
    },

    get submitted() {
      return snapshot().submitted;
    },

    submit(event?: Event) {
      return controller.submit(event);
    },

    get errors() {
      return snapshot().errors.form;
    },

    field(name) {
      const key = name as string;

      return {
        name: key,
        value: values[name],
        get errors() {
          return snapshot().errors.fields[key] ?? [];
        },
        get error() {
          return (snapshot().errors.fields[key] ?? [])[0] ?? null;
        },
      };
    },
  };
}

export default form;
