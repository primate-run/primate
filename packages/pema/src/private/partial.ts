import Loose from "#Loose";
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
>(input: D | ObjectType<D>): PartialType<StripReadonly<D>> {
  const dict = input instanceof ObjectType ? input.properties : input;
  const i = new PartialType(dict);
  i[Loose] = true;
  return i;
}

function strict<
  const D extends Partialable,
>(input: D | ObjectType<D>): PartialType<StripReadonly<D>> {
  const dict = input instanceof ObjectType ? input.properties : input;
  const i = new PartialType(dict);
  i[Loose] = false;
  return i;
}

const partial = { vanilla, loose, strict };

export default partial;
