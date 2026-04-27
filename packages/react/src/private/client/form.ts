import type { ClientMethod, FormInit, MethodMeta } from "@primate/core/client";
import core from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import * as React from "react";

type FormView<Values extends Dict> = {
  id: string;
  submitting: boolean;
  submitted: boolean;
  submit: React.FormEventHandler<HTMLFormElement>;
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
  const controller = React.useMemo(() => core.createForm({
    ...form_init,
    ...action !== undefined && {
      action: action as (args: { body: unknown }) => Promise<Response>,
      contentType,
    },
  }), []);
  const values = React.useMemo(() => initial ?? {} as Values, []);
  const snapshot = React.useSyncExternalStore(
    notify => controller.subscribe(() => notify()),
    controller.read,
    controller.read,
  );
  const submit = React.useCallback<React.FormEventHandler<HTMLFormElement>>(
    event => {
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
