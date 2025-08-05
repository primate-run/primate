import type Validated from "#client/Validated";
import makeValidate from "@primate/core/frontend/makeValidate";
import validate from "@primate/core/frontend/validate";
import type ValidateInit from "@primate/core/frontend/ValidateInit";
import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
import { ref, type Ref } from "vue";

function useValidate<T>(init: ValidateInit<T>): Validated<T> {
  const value: Ref<T> = ref(init.initial) as Ref<T>;
  const loading: Ref<boolean> = ref(false);
  const error: Ref<null | ValidationError<T>> = ref(null);

  async function update(updater: ValidateUpdater<T>) {
    const previous = value.value;
    const next = updater(previous);

    value.value = next;
    loading.value = true;
    error.value = null;

    try {
      await validate(init, next);
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

export default makeValidate(useValidate);
