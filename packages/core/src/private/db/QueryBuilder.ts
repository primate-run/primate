import type Schema from "#db/Schema";
import type { InferStoreOut, StoreSchema } from "pema";

type X<T> = {
  [K in keyof T]: T[K]
} & {};

type Filter<T, P extends keyof T> = X<Pick<T, Extract<P, keyof T>>>;
export default abstract class QueryBuilder<
  T extends StoreSchema,
  P extends keyof Schema<T> = keyof Schema<T>,
> {
  abstract where(criteria: any): QueryBuilder<T>;
  abstract select<K extends P>(...fields: K[]): QueryBuilder<T, K>;
  abstract run(): Promise<Filter<InferStoreOut<T>, P>>;
}
