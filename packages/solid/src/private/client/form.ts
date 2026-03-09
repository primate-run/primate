import core, { type FormInit } from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import { createSignal, onCleanup } from "solid-js";

type FormView<Values extends Dict> = {
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

function form<Values extends Dict>(init: Initial<Values>): FormView<Values>;
function form(init?: FormInit): FormView<Dict>;

function form<Values extends Dict = Dict>(
  init?: Initial<Values>,
): FormView<Values> {
  const { initial, ...form_init } = (init ?? {}) as Initial<Values>;
  const controller = core.createForm(form_init);
  const values = (initial ?? {}) as Values;
  const [snapshot, setSnapshot] = createSignal(controller.read());
  const unsub = controller.subscribe((next) => setSnapshot(next));
  onCleanup(unsub);

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
