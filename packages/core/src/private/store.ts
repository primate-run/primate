import type Init from "#store/Init";
import key from "#store/key";
import type { Relation } from "#store/relation";
import relation from "#store/relation";
import Store from "#store/Store";
import type StoreInput from "#store/StoreInput";
import type { Dict, EmptyDict } from "@rcompat/type";

function store<
  T extends StoreInput,
  R extends Dict<Relation> = EmptyDict,
>(init: Init<T, R>) {
  return new Store(init);
}

store.key = key;
store.relation = relation;

export default store;
