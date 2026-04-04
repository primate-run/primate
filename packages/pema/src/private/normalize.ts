import ArrayType from "#ArrayType";
import ConstructorType from "#ConstructorType";
import is_parsed from "#is-parsed";
import LiteralType from "#LiteralType";
import type NormalizeSchema from "#NormalizeSchema";
import NullType from "#NullType";
import ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import TupleType from "#TupleType";
import UndefinedType from "#UndefinedType";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

export default function normalize<const T extends Schema>(x: T): NormalizeSchema<T> {
  if (is_parsed(x)) return x as never;
  if (x === null) return new NullType() as never;
  if (x === undefined) return new UndefinedType() as never;

  if (is.string(x) || is.number(x) || is.boolean(x))
    return new LiteralType(x) as never;

  if (is.newable(x)) return new ConstructorType(x) as never;

  if (Array.isArray(x)) {
    return x.length === 1
      ? new ArrayType(normalize(x[0])) as never
      : new TupleType(x.map(normalize)) as never
      ;
  }

  if (is.dict(x)) {
    const props: Dict<Parsed<unknown>> = {};
    for (const [k, v] of Object.entries(x)) props[k] = normalize(v as Schema);
    return new ObjectType(props) as never;

  }

  throw new TypeError("Unsupported type-like value passed to asType");
}
