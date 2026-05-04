import ObjectType from "#ObjectType";
import type Partialable from "#Partialable";
import PartialType from "#PartialType";

type StripReadonly<T> = { -readonly [K in keyof T]: T[K] };

function vanilla<
  const D extends Partialable,
>(input: D | ObjectType<D>): PartialType<StripReadonly<D>> {
  const dict = input instanceof ObjectType ? input.properties : input;
  return new PartialType(dict);
}

function loose<
  const D extends Partialable,
>(input: D | ObjectType<D>): PartialType<StripReadonly<D>, true> {
  const dict = input instanceof ObjectType ? input.properties : input;
  return new PartialType(dict, true);
}

function strict<
  const D extends Partialable,
>(input: D | ObjectType<D>): PartialType<StripReadonly<D>, false> {
  const dict = input instanceof ObjectType ? input.properties : input;
  return new PartialType(dict, false);
}

const partial = { vanilla, loose, strict };

export default partial;
