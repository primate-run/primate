import type Store from "#db/Store";
import type EO from "@rcompat/type/EO";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type InferStore from "pema/InferStore";
import type StoreSchema from "pema/StoreSchema";

type Criteria = EO;
type Projection = EO[] | null;
type ReadOptions = {
  count?: boolean;
  limit?: number;
};

type CreateOptions = {
  limit?: number;
};
type Document = EO;
type Description = Record<string, keyof DataType>;

export default abstract class Database<S extends StoreSchema> {
  abstract schema: {
    create(name: string, description: Description): MaybePromise<void>;
    delete(name: string ): MaybePromise<void>;
  };

  abstract create(
    store: Store<S>,
    document: InferStore<S>,
    options?: CreateOptions,
  ): MaybePromise<InferStore<S>>;

  abstract read(
    store: Store<S>,
    criteria: Criteria,
    projection?: Projection,
    options?: ReadOptions,
  ): MaybePromise<Document[]>;

  abstract update(
    store: Store<S>,
    criteria: Criteria,
    set: Document
  ): MaybePromise<number>;

  abstract delete(
    store: Store<S>,
    criteria: Criteria,
  ): MaybePromise<void>;
};
