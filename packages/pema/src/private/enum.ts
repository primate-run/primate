import EnumType from "#EnumType";
import Loose from "#Loose";

function vanilla<T extends readonly string[]>(values: T) {
  return new EnumType(values);
}

function loose<T extends readonly string[]>(values: T) {
  const i = new EnumType(values);
  i[Loose] = true;
  return i;
}

function strict<T extends readonly string[]>(values: T) {
  const i = new EnumType(values);
  i[Loose] = false;
  return i;
}

const _enum = { vanilla, loose, strict };

export default _enum;
