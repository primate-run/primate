import ConstructorType from "#ConstructorType";
import type { AbstractNewable } from "@rcompat/type";

/**
 * Value is a constructed instance of the given class.
 */
const vanilla = function constructor<const C extends AbstractNewable>(c: C) {
  return new ConstructorType(c);
};

const loose = function constructor<const C extends AbstractNewable>(c: C) {
  return new ConstructorType(c);
};

const strict = function constructor<const C extends AbstractNewable>(c: C) {
  return new ConstructorType(c);
};

const constructor = { vanilla, loose, strict };

export default constructor;
