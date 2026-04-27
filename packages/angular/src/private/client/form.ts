import type { Signal } from "@angular/core";
import { DestroyRef, computed, inject, signal } from "@angular/core";
import type { ClientMethod, FormInit, MethodMeta } from "@primate/core/client";
import core from "@primate/core/client";
import type { Dict } from "@rcompat/type";

type Field<T> = {
  name: string;
  value: T;
  errors: Signal<string[]>;
  error: Signal<string | null>;
};

type FormView<Values extends Dict> = {
  id: string;
  submitting: Signal<boolean>;
  submitted: Signal<boolean>;
  submit: (event?: Event) => Promise<void>;
  errors: Signal<string[]>;
  field: <K extends keyof Values & string>(name: K) => Field<Values[K]>;
};

type Initial<Values extends Dict> = FormInit & { initial?: Values };

function try_destroy_ref(): DestroyRef | null {
  try {
    return inject(DestroyRef);
  } catch {
    return null;
  }
}

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
    ...(action !== undefined && {
      action: action as (args: { body: unknown }) => Promise<Response>,
      contentType,
    }),
  });
  const values = (initial ?? {}) as Values;
  const snap = signal(controller.read());
  const unsubscribe = controller.subscribe(next => snap.set(next));
  try_destroy_ref()?.onDestroy(unsubscribe);
  const submitting = computed(() => snap().submitting);
  const submitted = computed(() => snap().submitted);
  const errors = computed(() => snap().errors.form);
  const cache = new Map<string, Field<any>>();

  function field<K extends keyof Values & string>(name: K): Field<Values[K]> {
    const cached = cache.get(name);
    if (cached) return cached as Field<Values[K]>;
    const form_errors = computed(() => snap().errors.fields[name] ?? []);
    const view: Field<Values[K]> = {
      name,
      value: values[name],
      errors: form_errors,
      error: computed(() => form_errors()[0] ?? null),
    };
    cache.set(name, view);
    return view;
  }

  return {
    id: controller.id,
    submitting,
    submitted,
    submit: (event?: Event) => controller.submit(event),
    errors,
    field,
  };
}

export default form;
