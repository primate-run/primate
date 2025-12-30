import client, {
  type ValidateInit,
  type ValidateUpdater,
  type ValidationError,
} from "@primate/core/client";
import { ref, type Ref } from "vue";

type Validated<T> = {
  error: Ref<null | ValidationError>;
  loading: Ref<boolean>;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: Ref<T>;
};

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const value: Ref<T> = ref(init.initial) as Ref<T>;
  const loading: Ref<boolean> = ref(false);
  const error: Ref<null | ValidationError> = ref(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value.value;
    const next = updater(previous);

    value.value = next;
    loading.value = true;
    error.value = null;

    try {
      await client.validateField(init, next);
    } catch (e) {
      // rollback
      value.value = previous;
      error.value = e as ValidationError;
    } finally {
      loading.value = false;
    }
  }

  return { error, loading, update, value };
}

const field = client.toValidated(useValidate);

export default field;
