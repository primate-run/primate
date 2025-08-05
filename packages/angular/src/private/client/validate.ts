import type Validated from "#client/Validated";
import { signal } from "@angular/core";
import type ValidateInit from "@primate/core/frontend/ValidateInit";
import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
import makeValidate from "@primate/core/frontend/makeValidate";
import validate from "@primate/core/frontend/validate";

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const value = signal<T>(init.initial);
  const loading = signal(false);
  const error = signal<null | ValidationError<T>>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value();
    const next = updater(previous);

    value.set(next);
    loading.set(true);
    error.set(null);

    try {
      await validate(init, next);
    } catch (e) {
      value.set(previous);
      error.set(e as ValidationError<T>);
    } finally {
      loading.set(false);
    }
  }

  return { error, loading, update, value };
}

export default makeValidate(useValidate);
