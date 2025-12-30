import core, { type FormInit } from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import { onUnmounted, shallowRef } from "vue";

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
  const snapshot = shallowRef(controller.read());
  const unsub = controller.subscribe(next => {
    snapshot.value = next;
  });
  onUnmounted(unsub);

  return {
    id: controller.id,

    get submitting() {
      return snapshot.value.submitting;
    },

    submit: (event?: Event) => controller.submit(event),

    get errors() {
      return snapshot.value.errors.form;
    },

    field(name) {
      const key = name as string;
      const errs = snapshot.value.errors.fields[key] ?? [];

      return {
        name: key,
        value: values[name],
        error: errs[0] ?? null,
        errors: errs,
      };
    },
  };
}

export default form;
