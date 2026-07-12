import type Mode from "#Mode";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import type { Dict, MaybePromise } from "@rcompat/type";

type Derive<Input, Output> = (value: Input) => MaybePromise<Output>;

export default class AsyncType<
  P extends Dict<Parsed<unknown>> = Dict<Parsed<unknown>>,
  M extends Mode = undefined,
  I = ObjectType<P, M>["infer"],
  Output = I,
> {
  #schema: ObjectType<P, M, I>;
  #derive: Derive<I, Output>;

  constructor(
    schema: ObjectType<P, M, I>,
    derive: Derive<I, Output> = value => value as unknown as Output,
  ) {
    this.#schema = schema;
    this.#derive = derive;
  }

  get infer() {
    return undefined as Output;
  }

  get input() {
    return this.#schema.input;
  }

  get schema() {
    return this.#schema;
  }

  get properties() {
    return this.#schema.properties;
  }

  derive<Next>(derive: Derive<Output, Next>) {
    const next = async (value: I): Promise<Awaited<Next>> =>
      await derive(await this.#derive(value)) as Awaited<Next>;
    return new AsyncType<P, M, I, Awaited<Next>>(this.#schema, next);
  }

  async parse(u: unknown, options?: ParseOptions): Promise<Output> {
    return this.#derive(this.#schema.parse(u, options));
  }
}
