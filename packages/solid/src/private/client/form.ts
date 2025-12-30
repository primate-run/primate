import core, { type FormInit } from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import { createSignal, onCleanup } from "solid-js";

type FormView<Values extends Dict> = {
  id: string;
  submitting: boolean;
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
  const { initial, ...form_init } = init ?? {} as Initial<Values>;
  const controller = core.createForm(form_init);
  const values = initial ?? {} as Values;
  const [snapshot, setSnapshot] = createSignal(controller.read());
  const unsub = controller.subscribe((next) => setSnapshot(next));
  onCleanup(unsub);

  return {
    id: controller.id,

    get submitting() {
      return snapshot().submitting;
    },

    submit: (event?: Event) => controller.submit(event),

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
          const errors = snapshot().errors.fields[key] ?? [];
          return errors[0] ?? null;
        },
      };
    },
  };
}

export default form;
