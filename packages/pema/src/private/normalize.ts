import ArrayType from "#ArrayType";
import ConstructorType from "#ConstructorType";
import LiteralType from "#LiteralType";
import type NormalizeSchema from "#NormalizeSchema";
import NullType from "#NullType";
import ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import type Schema from "#Schema";
import TupleType from "#TupleType";
import UndefinedType from "#UndefinedType";
import newable from "@rcompat/is/newable";
import type Dict from "@rcompat/type/Dict";

function isParsed(x: unknown): x is Parsed<unknown> {
  return !!x && typeof x === "object" && ParsedKey in (x as any);
}

function isPlain(x: unknown): x is Dict {
  return !!x && typeof x === "object" &&
    Object.getPrototypeOf(x) === Object.prototype;
}

export default function normalize<const T extends Schema>(x: T): NormalizeSchema<T> {
  if (isParsed(x)) return x as never;

  if (x === null) return new NullType() as never;
  if (x === undefined) return new UndefinedType() as never;

  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean")
    return new LiteralType(x) as never;

  if (newable(x)) {
    return new ConstructorType(x) as never;
  }

  if (Array.isArray(x)) {
    return x.length === 1
      ? new ArrayType(normalize(x[0])) as never
      : new TupleType(x.map(normalize)) as never
      ;
  }

  if (isPlain(x)) {
    const props: Dict<Parsed<unknown>> = {};
    for (const [k, v] of Object.entries(x)) props[k] = normalize(v as Schema);
    return new ObjectType(props) as never;

  }

  throw new TypeError("Unsupported type-like value passed to asType");
}
