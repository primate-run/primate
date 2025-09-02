import type InferStore from "#InferStore";
import type StoreId from "#StoreId";
import type StoreSchema from "#StoreSchema";

type InferStoreOut<T extends StoreSchema> =
  Omit<InferStore<T>, "id"> & { id: StoreId<T> };

export type { InferStoreOut as default };
