import type Validated from "#client/Validated";
import toValidated from "@primate/core/frontend/toValidated";
import validate from "@primate/core/frontend/validate";
import type ValidateInit from "@primate/core/frontend/ValidateInit";
import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
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
