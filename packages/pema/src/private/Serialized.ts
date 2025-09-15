import type Dict from "@rcompat/type/Dict";
import type JSONValue from "@rcompat/type/JSONValue";

type DT<D extends string = string> = { datatype?: D };

type PrimitiveSerialized =
  | { type: "string" } & DT
  | { type: "boolean" } & DT
  | { type: "symbol" } & DT
  | { type: "null" } & DT
  | { type: "undefined" } & DT
  | { type: "date" } & DT
  | { type: "blob" } & DT
  | { type: "file" } & DT
  | { type: "url" } & DT
  ;

type NumberSerialized = { type: "number" } & DT;
type BigIntSerialized = { type: "bigint" } & DT;

type StructuralSerialized =
  | { type: "newable"; of: string }
  | { type: "literal"; value: JSONValue }
  | { type: "array"; of: Serialized }
  | { type: "tuple"; of: Serialized[] }
  | { type: "record"; key: Serialized; value: Serialized }
  | { type: "object"; properties: Dict<Serialized> }
  | { type: "union"; of: Serialized[] }
  | { type: "optional"; of: Serialized }
  | { type: "default"; of: Serialized }
  | { type: "partial"; of: Serialized }
  | { type: "schema"; of: Serialized }
  | { type: "pure" }
  | { type: "primary" }
  ;

type Serialized =
  | PrimitiveSerialized
  | NumberSerialized
  | BigIntSerialized
  | StructuralSerialized
  ;

export type { Serialized as default };
