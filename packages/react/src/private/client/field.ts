import client, {
  type ValidateInit,
  type ValidateUpdater,
  type ValidationError,
} from "@primate/core/client";
import { useState } from "react";

type Validated<T> = {
  error: null | ValidationError;
  loading: boolean;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: T;
};

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const [value, setValue] = useState(init.initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | ValidationError>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value;
    const next = updater(previous);

    setValue(next);
    setLoading(true);
    setError(null);

    try {
      await client.validateField(init, next);
    } catch (e) {
      // rollback
      setValue(previous);
      setError(e as ValidationError);
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, update, value };
}

const field = client.toValidated(useValidate);

export default field;
