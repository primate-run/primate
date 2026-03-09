import type { FormInit } from "@primate/core/client";
import core from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import * as React from "react";

type FormView<TValues extends Dict> = {
  id: string;
  submitting: boolean;
  submitted: boolean;
  submit: React.FormEventHandler<HTMLFormElement>;
  errors: readonly string[];
  field: <K extends keyof TValues & string>(name: K) => {
    name: string;
    value: TValues[K];
    error: string | null;
    errors: readonly string[];
  };
};

type Initial<Values extends Dict> = FormInit & { initial?: Values };

function form<Values extends Dict>(init: Initial<Values>): FormView<Values>;
function form(init?: FormInit): FormView<Dict>;

function form<Values extends Dict = Dict>(init?: Initial<Values>) {
  const { initial, ...form_init } = (init ?? {}) as Initial<Values>;

  const controller = React.useMemo(() => core.createForm(form_init), []);
  const values = React.useMemo(() => (initial ?? {}) as Values, []);

  const snapshot = React.useSyncExternalStore(
    (notify) => controller.subscribe(() => notify()),
    controller.read,
    controller.read,
  );

  const submit = React.useCallback<React.FormEventHandler<HTMLFormElement>>(
    (event) => {
      controller.submit({
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
        currentTarget: event.currentTarget,
      } as unknown as Event);
    },
    [controller],
  );

  return React.useMemo(() => {
    const view: FormView<Values> = {
      id: snapshot.id,
      submitting: snapshot.submitting,
      submitted: snapshot.submitted,
      submit,
      errors: snapshot.errors.form,
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

    return view;
  }, [snapshot, submit, values]);
}

export default form;
