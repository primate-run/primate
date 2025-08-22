import type Partialable from "#Partialable";
import PartialType from "#PartialType";
import SchemaType from "#SchemaType";

export default function partial<
  const D extends Partialable,
>(input: D | SchemaType<D>) {
  const dict = input instanceof SchemaType ? input.schema : input;
  return new PartialType(dict);
}
