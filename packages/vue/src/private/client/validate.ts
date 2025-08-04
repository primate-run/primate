import type ValidationError from "@primate/core/frontend/ValidationError";
import type Dict from "@rcompat/type/Dict";
import { ref, type Ref } from "vue";

type ValidateUpdater<T> = (previous: T) => T;

export type ValidateReturn<T> = {
  error: Ref<null | ValidationError<T>>;
  loading: Ref<boolean>;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: Ref<T>;
};

function useValidate<T>(
  initial: T,
  updateFn: (value: T) => Promise<void>,
): ValidateReturn<T> {
  const value: Ref<T> = ref(initial) as Ref<T>;
  const loading: Ref<boolean> = ref(false);
  const error: Ref<null | ValidationError<T>> = ref(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value.value;
    const newValue = updater(previous);

    value.value = newValue;
    loading.value = true;
    error.value = null;

    try {
      await updateFn(newValue);
    } catch (e) {
      // rollback
      value.value = previous;
      error.value = e as ValidationError<T>;
    } finally {
      loading.value = false;
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
