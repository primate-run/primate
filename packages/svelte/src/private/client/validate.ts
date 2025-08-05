import type Validated from "#client/Validated";
import type ValidateState from "#client/ValidateState";
import makeValidate from "@primate/core/frontend/makeValidate";
import validate from "@primate/core/frontend/validate";
import type ValidateInit from "@primate/core/frontend/ValidateInit";
import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
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
      set({ error: e as ValidationError<T>, loading: false, value: previous! });
    }
  }

  return { subscribe, update: $update };
}

export default makeValidate(useValidate);
