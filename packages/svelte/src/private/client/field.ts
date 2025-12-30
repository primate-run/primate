import client, {
  type ValidateInit,
  type ValidateUpdater,
  type ValidationError,
} from "@primate/core/client";
import { writable, type Readable } from "svelte/store";

type ValidateState<T> = {
  error: null | ValidationError;
  loading: boolean;
  value: T;
};

type Validated<T> = {
  update: (updater: ValidateUpdater<T>) => Promise<void>;
} & Readable<ValidateState<T>>;

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  let current = init.initial;
  const { set, subscribe, update } = writable<ValidateState<T>>({
    error: null,
    loading: false,
    value: current,
  });

  async function $update(updater: ValidateUpdater<T>) {
    let previous: T;
    update((s) => {
      previous = s.value;
      const next_value = updater(s.value);
      current = next_value;
      return { ...s, error: null, loading: true, value: next_value };
    });

    try {
      await client.validateField(init, current);
      update((s) => ({ ...s, loading: false }));
    } catch (e) {
      // rollback
      current = previous!;
      set({ error: e as ValidationError, loading: false, value: previous! });
    }
  }

  return { subscribe, update: $update };
}

const field = client.toValidated(useValidate);

export default field;
