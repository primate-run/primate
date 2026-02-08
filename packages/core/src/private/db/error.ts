import fail from "#fail";
import type { Dict } from "@rcompat/type";

function coded<T extends Dict<(...args: any[]) => Error>>(fns: T): T {
  return Object.fromEntries(
    Object.entries(fns).map(([key, fn]) => [
      key,
      (...args: any[]) => {
        const err = fn(...args);
        (err as any).code = key;
        return err;
      },
    ]),
  ) as T;
}

function db_missing() {
  return fail("database missing");
}
function store_name_required() {
  return fail("store name required");
}
function unregistered_schema() {
  return fail("no store registered for schema");
}
function record_not_found(field: string, x: string | number | bigint) {
  return fail("no record with {0} = {1}", field, x);
}
function key_duplicate(key: string) {
  return fail("key {0} already exists", key);
}

const STORE = coded({
  db_missing,
  store_name_required,
  unregistered_schema,
  record_not_found,
  key_duplicate,
});

const pk_undefined = (store: string) => fail("{0}: store has no primary key", store);
const pk_immutable = (pk: string) => fail("primary key {0} cannot be updated", pk);
const pk_duplicate = (pk: string) => fail("primary key {0} already exists", pk);
function pk_invalid(pk: unknown) {
  return fail("pk must be string, number or bigint, got {0}", kind_of(pk));
}

function pk_required(table: string) {
  return fail("pk is required, table {0} has generate_pk=false", table);
}

const PK = coded({
  pk_undefined,
  pk_immutable,
  pk_duplicate,
  pk_invalid,
  pk_required,
});

type Context = "select" | "where" | "sort" | "insert" | "set";

const field_unknown = (field: string, context: Context) =>
  fail("{0}: unknown field on {1}", field, context);
const field_duplicate = (field: string, context: Context) =>
  fail("{0}: duplicate field on {1}", field, context);
const field_required = (op: string) => fail("{0}: at least one field required", op);
const field_undefined = (field: string, context: Context) => fail("{0}: undefined value on {1}", field, context);
const fields_unknown = (fields: string[]) =>
  fail("unknown fields {0}", fields.join(", "));

const FIELD = coded({
  field_unknown,
  field_duplicate,
  field_required,
  field_undefined,
  fields_unknown,
});

function null_not_allowed(field: string) {
  return fail("{0}: null not allowed", field);
}

const NULL = coded({
  null_not_allowed,
});

function kind_of(x: unknown) {
  if (x === null) return "null";
  if (x instanceof Date) return "Date";
  if (x instanceof URL) return "URL";
  if (x instanceof Blob) return "Blob";
  return typeof x;
}

function wrong_type(
  type: "string" | "number" | "bigint" | "boolean" | "url" | "date" | "blob",
  field: string,
  got: unknown,
  op = "value",
) {
  return fail("{0}: {1} requires {2}, got {3}", field, op, type, kind_of(got));
}

function operator_unknown(field: string, operator: string) {
  return fail("{0}: unknown operator {1}", field, operator);
}
function operator_empty(field: string) {
  return fail("{0}: empty operator", field);
}
function operator_scalar(field: string) {
  return fail("{0}: operator requires scalar value", field);
}

const OPERATOR = coded({
  operator_unknown,
  operator_empty,
  wrong_type,
  operator_scalar,
});

const sort_empty = () => fail("empty sort");
const sort_invalid = () => fail("sort invalid");
function sort_invalid_value(field: string, x: unknown) {
  return fail("{0}: invalid sort value, received {1}", field, kind_of(x));
}
const select_empty = () => fail("empty select");
const select_invalid = () => fail("invalid select");
const limit_invalid = () => fail("invalid limit");
function select_invalid_value(index: number, x: unknown) {
  return fail("select[{0}]: must be string, received {1}", index, kind_of(x));
}
const where_required = () => fail("empty where");
const where_invalid = () => fail("where invalid");
function where_invalid_value(field: string, x: unknown) {
  return fail("{0}: invalid where value, received {1}", field, kind_of(x));
}
const set_empty = () => fail("empty set on update");

const QUERY = coded({
  sort_empty,
  sort_invalid,
  sort_invalid_value,
  select_empty,
  select_invalid,
  select_invalid_value,
  where_required,
  where_invalid,
  where_invalid_value,
  set_empty,
  limit_invalid,
});

const relation_unknown = (rel: string) => fail("unknown relation {0}", rel);
const relation_requires_pk = (type: "target" | "parent") =>
  fail("relation loading requires {0} primary key", type);

const RELATION = coded({
  relation_unknown,
  relation_requires_pk,
});

const option_unknown = (opt: string) => fail("unknown option {0}", opt);
const identifier_invalid = (name: string) => fail("invalid identifier {0}", name);
const count_with_invalid = () => fail("count and with are mutually exclusive");

function count_overflow(table: string, count: unknown) {
  return fail("{0}: count overflow, received {1} (max {2})",
    table, count, Number.MAX_SAFE_INTEGER);
}

const MISC = coded({
  option_unknown,
  identifier_invalid,
  count_with_invalid,
  count_overflow,
});

const errors = {
  ...STORE,
  ...PK,
  ...FIELD,
  ...NULL,
  ...OPERATOR,
  ...QUERY,
  ...RELATION,
  ...MISC,
};

export type Code = keyof typeof errors;

export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
