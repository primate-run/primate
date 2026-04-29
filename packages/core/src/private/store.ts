import type Init from "#store/Init";
import key from "#store/key";
import relation from "#store/relation";
import Store from "#store/Store";
import type StoreInput from "#store/StoreInput";

function store<
  T extends StoreInput,
  const N extends string = string,
>(init: Init<T, N>) {
  return new Store(init);
}

store.key = key;
store.relation = relation;

export default store;
