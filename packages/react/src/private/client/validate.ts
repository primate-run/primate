import type ValidationError from "@primate/core/frontend/ValidationError";
import type Dict from "@rcompat/type/Dict";
import { useEffect, useState } from "react";

type ValidateUpdater<T> = (previous: T) => T;

type ValidateReturn<T> = {
  error: null | ValidationError<T>;
  loading: boolean;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: T;
};

function useValidate<T>(
  initial: T,
  updateFn: (value: T) => Promise<void>,
): ValidateReturn<T> {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | ValidationError<T>>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value;
    const newValue = updater(previous);
    setValue(newValue);
    setLoading(true);
    setError(null);

    try {
      await updateFn(newValue);
    } catch (e) {
      // rollback
      setValue(previous);
      setError(e as ValidationError<T>);
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, update, value };
}

export default function validate<T>(initial: T) {
  return {
    post: (
      url: string,
      mapper: (value: T) => unknown,
      headers: Dict<string> = { "Content-Type": "application/json" },
    ) => {
      return useValidate(initial, async (value) => {
        const response = await fetch(url, {
          body: JSON.stringify(mapper(value)),
          headers,
          method: "POST",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw data.error as ValidationError<T> ?? "Unknown error";
        }
      });
    },
  };
}
