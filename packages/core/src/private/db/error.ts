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

const db_missing = () => fail("database missing");
const store_name_required = () => fail("store name required");
const unregistered_schema = () => fail("no store registered for schema");
const record_not_found = (field: string, value: string | number | bigint) =>
  fail("no record with {0} = {1}", field, value);
const key_duplicate = (key: string) => fail("key {0} already exists", key);

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
const pk_invalid = (pk: unknown) => fail("pk must be string, number or bigint, got {0}", typeof pk);

const PK = coded({
  pk_undefined,
  pk_immutable,
  pk_duplicate,
  pk_invalid,
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

function operator_unknown(field: string, operator: string) {
  return fail("{0}: unknown operator {1}", field, operator);
}
function operator_empty(field: string) {
  return fail("{0}: empty operator", field);
}
function operator_type(type: "string" | "number" | "bigint" | "date") {
  return `{0}: {1} requires ${type}, got {2}`;
}
function operator_type_string(field: string, op: string, got: unknown) {
  return fail(operator_type("string"), field, op, typeof got);
}
function operator_type_number(field: string, op: string, got: unknown) {
  return fail(operator_type("number"), field, op, typeof got);
}
function operator_type_bigint(field: string, op: string, got: unknown) {
  return fail(operator_type("bigint"), field, op, typeof got);
}
function operator_type_date(field: string, op: string, got: unknown) {
  return fail(operator_type("date"), field, op, typeof got);
}
function operator_scalar(field: string) {
  return fail("{0}: operator requires scalar value", field);
}

const OPERATOR = coded({
  operator_unknown,
  operator_empty,
  operator_type_string,
  operator_type_number,
  operator_type_bigint,
  operator_type_date,
  operator_scalar,
});

const sort_empty = () => fail("empty sort");
const sort_invalid = () => fail("sort invalid");
const sort_invalid_value = (field: string, value: unknown) =>
  fail("{0}: invalid sort value, received {1}", field, typeof value);
const select_empty = () => fail("empty select");
const select_invalid = () => fail("invalid select");
const limit_invalid = () => fail("invalid limit");
const select_invalid_value = (index: number, value: unknown) =>
  fail("select[{0}]: must be string, received {1}", index, typeof value);
const where_required = () => fail("empty where");
const where_invalid = () => fail("where invalid");
const where_invalid_value = (field: string, value: unknown) =>
  fail("{0}: invalid where value, received {1}", field, typeof value);
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

const MISC = coded({
  option_unknown,
  identifier_invalid,
  count_with_invalid,
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
