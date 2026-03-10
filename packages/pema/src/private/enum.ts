import EnumType from "#EnumType";

export default function _enum<T extends readonly string[]>(values: T) {
  return new EnumType(values);
}
