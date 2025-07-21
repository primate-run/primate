import ConstructorType from "#ConstructorType";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

/**
 * Value is a constructed instance of the given class.
 */
export default <const C extends AbstractConstructor>(constructor: C) =>
  new ConstructorType(constructor);
