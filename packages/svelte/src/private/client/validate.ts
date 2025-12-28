import type Validated from "#client/Validated";
import type ValidateState from "#client/ValidateState";
import toValidated from "@primate/core/client/toValidated";
import validate from "@primate/core/client/validate";
import type ValidateInit from "@primate/core/client/ValidateInit";
import type ValidateUpdater from "@primate/core/client/ValidateUpdater";
import type ValidationError from "@primate/core/client/ValidationError";
import { get, writable } from "svelte/store";

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const { set, subscribe, update } = writable<ValidateState<T>>({
    error: null,
    loading: false,
    value: init.initial,
  });

  async function $update(updater: ValidateUpdater<T>) {
    let previous: T;
    update((s) => {
      previous = s.value;
      return { ...s, error: null, loading: true, value: updater(s.value) };
    });

    try {
      await validate(init, get({ subscribe }).value);
      update(s => ({ ...s, loading: false }));
    } catch (e) {
      // rollback
      set({ error: e as ValidationError, loading: false, value: previous! });
    }
  }

  return { subscribe, update: $update };
}

export default { field: toValidated(useValidate) };
