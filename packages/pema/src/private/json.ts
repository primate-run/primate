import type { ParsedJSON } from "#JSONType";
import JSONType from "#JSONType";

// overload 1: no schema -> JSONValue
function vanilla(): JSONType<undefined>;
// overload 2: schema -> strongly typed
function vanilla<S extends ParsedJSON>(inner: S): JSONType<S>;
function vanilla(inner?: any) {
  return new JSONType(inner);
}

function loose(): JSONType<undefined>;
function loose<S extends ParsedJSON>(inner: S): JSONType<S>;
function loose(inner?: any) {
  return new JSONType(inner);
}

function strict(): JSONType<undefined>;
function strict<S extends ParsedJSON>(inner: S): JSONType<S>;
function strict(inner?: any) {
  return new JSONType(inner);
}

const json = { vanilla, loose, strict };

export default json;
