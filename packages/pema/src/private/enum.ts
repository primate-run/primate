import EnumType from "#EnumType";

function vanilla<T extends readonly string[]>(values: T) {
  return new EnumType(values);
}

function loose<T extends readonly string[]>(values: T) {
  return new EnumType(values);
}

function strict<T extends readonly string[]>(values: T) {
  return new EnumType(values);
}

export default { loose, strict, vanilla };
