import ConstructorType from "#ConstructorType";
import Loose from "#Loose";
import type { AbstractNewable } from "@rcompat/type";

/**
 * Value is a constructed instance of the given class.
 */
const vanilla = function constructor<const C extends AbstractNewable>(c: C) {
  return new ConstructorType(c);
};

const loose = function constructor<const C extends AbstractNewable>(c: C) {
  const i = new ConstructorType(c);
  i[Loose] = true;
  return i;
};

const strict = function constructor<const C extends AbstractNewable>(c: C) {
  const i = new ConstructorType(c);
  i[Loose] = false;
  return i;
};

const constructor = { vanilla, loose, strict };

export default constructor;
