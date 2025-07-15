import type StoreSchema from "pema/StoreSchema";
import type Document from "#db/Document";

type X<T> = {
  [K in keyof T]: T[K]
} & {};

type Filter<T, P extends keyof T> = X<Pick<T, Extract<P, keyof T>>>;

export default class Query<
  T extends StoreSchema,
  P extends keyof Document<T> = keyof Document<T>,
> {
  #schema: T;
  #projection?: P[];

  constructor(schema: T) {
    this.#schema = schema;
  }

  select<K extends P>(...projection: K[]): Query<T, K> {
    this.#projection = projection;
    return this as unknown as Query<T, K>;
  }

  async run(): Promise<Filter<Document<T>, P>>{
    return this.#schema.infer as any;
  }
}
