import type Validated from "#client/Validated";
import toValidated from "@primate/core/client/toValidated";
import validate from "@primate/core/client/validate";
import type ValidateInit from "@primate/core/client/ValidateInit";
import type ValidateUpdater from "@primate/core/client/ValidateUpdater";
import type ValidationError from "@primate/core/client/ValidationError";
import { useState } from "react";

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
      await validate(init, next);
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

export default toValidated(useValidate);
