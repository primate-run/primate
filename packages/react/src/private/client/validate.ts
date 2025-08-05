import type Validated from "#client/Validated";
import makeValidate from "@primate/core/frontend/makeValidate";
import validate from "@primate/core/frontend/validate";
import type ValidateInit from "@primate/core/frontend/ValidateInit";
import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
import { useState } from "react";

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const [value, setValue] = useState(init.initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | ValidationError<T>>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value;
    const next = updater(previous);

    setValue(next);
    setLoading(true);
    setError(null);

    try {
      await validate(init, next);
    } catch (e) {
      setValue(previous);
      setError(e as ValidationError<T>);
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, update, value };
}

export default makeValidate(useValidate);
