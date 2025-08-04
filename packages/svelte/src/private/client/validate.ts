import type ValidationError from "@primate/core/frontend/ValidationError";
import type Dict from "@rcompat/type/Dict";
import type { Readable } from "svelte/store";
import { get, writable } from "svelte/store";

type ValidateUpdater<T> = (previous: T) => T;

type ValidateState<T> = {
  error: null | ValidationError<T>;
  loading: boolean;
  value: T;
};

type ValidateStore<T> = {
  update: (updater: ValidateUpdater<T>) => Promise<void>;
} & Readable<ValidateState<T>>;

function useValidate<T>(
  initial: T,
  updateFn: (value: T) => Promise<void>,
): ValidateStore<T> {
  const { set, subscribe, update } = writable<ValidateState<T>>({
    error: null,
    loading: false,
    value: initial,
  });

  async function $update(updater: ValidateUpdater<T>) {
    let previous: T;
    update((s) => {
      previous = s.value;
      return { ...s, error: null, loading: true, value: updater(s.value) };
    });

    try {
      const newValue = get({ subscribe }).value;
      await updateFn(newValue);
      update((s) => ({ ...s, loading: false }));
    } catch (e) {
      set({ error: e as ValidationError<T>, loading: false, value: previous! });
    }
  }

  return { subscribe, update: $update };
}

export default function validate<T>(initialValue: T) {
  return {
    post: (
      url: string,
      mapper: (newValue: T) => unknown,
      headers: Dict<string> = { "Content-Type": "application/json" },
    ) =>
      useValidate(initialValue, async (newValue) => {
        const res = await fetch(url, {
          body: JSON.stringify(mapper(newValue)),
          headers,
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw data.error as ValidationError<T>;
        }
      }),
  };
}
