import type Validated from "#client/Validated";
import { signal } from "@angular/core";
import toValidated from "@primate/core/client/toValidated";
import validate from "@primate/core/client/validate";
import type ValidateInit from "@primate/core/client/ValidateInit";
import type ValidateUpdater from "@primate/core/client/ValidateUpdater";
import type ValidationError from "@primate/core/client/ValidationError";

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const value = signal<T>(init.initial);
  const loading = signal(false);
  const error = signal<null | ValidationError>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value();
    const next = updater(previous);

    value.set(next);
    loading.set(true);
    error.set(null);

    try {
      await validate(init, next);
    } catch (e) {
      // rollback
      value.set(previous);
      error.set(e as ValidationError);
    } finally {
      loading.set(false);
    }
  }

  return { error, loading, update, value };
}

export default toValidated(useValidate);
