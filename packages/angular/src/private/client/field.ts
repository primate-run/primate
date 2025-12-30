import type Validated from "#client/Validated";
import { signal } from "@angular/core";
import client, {
  type ValidateInit,
  type ValidateUpdater,
  type ValidationError,
} from "@primate/core/client";

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
      await client.validateField(init, next);
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

const field = client.toValidated(useValidate);

export default field;
