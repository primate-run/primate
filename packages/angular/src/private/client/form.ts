import {
  DestroyRef,
  computed,
  inject,
  signal,
  type Signal,
} from "@angular/core";
import core, { type FormInit } from "@primate/core/client";
import type { Dict } from "@rcompat/type";

type Field<T> = {
  name: string;
  value: T;
  errors: Signal<readonly string[]>;
  error: Signal<string | null>;
};

type FormView<Values extends Dict> = {
  id: string;
  submitting: Signal<boolean>;
  submit: (event?: Event) => Promise<void>;

  errors: Signal<readonly string[]>;

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

function form<Values extends Dict>(init: Initial<Values>): FormView<Values>;
function form(init?: FormInit): FormView<Dict>;

function form<Values extends Dict = Dict>(init?: Initial<Values>) {
  const { initial, ...form_init } = init ?? {} as Initial<Values>;
  const controller = core.createForm(form_init);
  const values = initial ?? {} as Values;
  const snap = signal(controller.read());
  const unsub = controller.subscribe((next) => snap.set(next));
  try_destroy_ref()?.onDestroy(unsub);
  const submitting = computed(() => snap().submitting);
  const errors = computed(() => snap().errors.form);

  // cache per-field views so templates calling field("x") repeatedly
  // don't recreate computed signals every change detection cycle
  const cache = new Map<string, Field<any>>();

  function field<K extends keyof Values & string>(name: K): Field<Values[K]> {
    const key = name as string;

    const cached = cache.get(key);
    if (cached) return cached as Field<Values[K]>;

    const form_errors = computed(() => snap().errors.fields[key] ?? []);
    const view: Field<Values[K]> = {
      name: key,
      value: values[name],
      errors: form_errors,
      error: computed(() => form_errors()[0] ?? null),
    };

    cache.set(key, view);
    return view;
  }

  return {
    id: controller.id,
    submitting,
    submit: (event?: Event) => controller.submit(event),
    errors,
    field,
  };
}

export default form;
