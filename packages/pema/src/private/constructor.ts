import ConstructorType from "#ConstructorType";
import type { AbstractNewable } from "@rcompat/type";

/**
 * Value is a constructed instance of the given class.
 */
export default <const C extends AbstractNewable>(constructor: C) =>
  new ConstructorType(constructor);
