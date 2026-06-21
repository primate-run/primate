import EnumType, { type Enum } from "#EnumType";
import u8 from "#u8";
import type { Dict } from "@rcompat/type";

function vanilla<const V extends Dict<number>>(values: V): Enum<V, undefined> {
  return new EnumType(values, u8.vanilla) as Enum<V, undefined>;
}

function loose<const V extends Dict<number>>(values: V): Enum<V, true> {
  return new EnumType(values, u8.loose) as Enum<V, true>;
}

function strict<const V extends Dict<number>>(values: V): Enum<V, false> {
  return new EnumType(values, u8.strict) as Enum<V, false>;
}

export default { vanilla, loose, strict };
