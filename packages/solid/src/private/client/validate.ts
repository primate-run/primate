import type ValidationError from "@primate/core/frontend/ValidationError";
import type Dict from "@rcompat/type/Dict";
import { createSignal } from "solid-js";

type ValidateUpdater<T> = (previous: T) => T;

type ValidateReturn<T> = {
  error: () => null | ValidationError<T>;
  loading: () => boolean;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: () => T;
};

function useValidate<T>(
  initial: T,
  updateFn: (value: T) => Promise<void>,
): ValidateReturn<T> {
  const [value, setValue] = createSignal(initial);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<null | ValidationError<T>>(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value();
    const newValue = updater(value());

    setValue(() => newValue);
    setLoading(true);
    setError(null);

    try {
      await updateFn(newValue);
    } catch (e) {
      setValue(() => previous);
      setError(() => e as ValidationError<T>);
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, update, value };
}

export default function validate<T>(initialValue: T) {
  return {
    post: (
      url: string,
      bodyMapper: (newValue: T) => unknown,
      headers: Dict<string> = { "Content-Type": "application/json" },
    ) =>
      useValidate(initialValue, async (newValue) => {
        const res = await fetch(url, {
          body: JSON.stringify(bodyMapper(newValue)),
          headers,
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw data.error as ValidationError<T>;
        }
      }),
  };
}

