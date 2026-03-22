import fail from "#fail";
import type { Dict } from "@rcompat/type";

const MAX_INT = Number.MAX_SAFE_INTEGER;

function kind_of(x: unknown) {
  if (x === null) return "null";
  if (x instanceof Date) return "Date";
  if (x instanceof URL) return "URL";
  if (x instanceof Blob) return "Blob";
  return typeof x;
}

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
  return fail`database missing`;
}
function store_name_required() {
  return fail`store name required`;
}
function unregistered_schema() {
  return fail`no store registered for schema`;
}
function record_not_found(field: string, value: string | number | bigint) {
  return fail`no record with ${field} = ${value}`;
}
function key_duplicate(key: string) {
  return fail`key ${key} already exists`;
}
function table_not_found(table: string) {
  return fail`table ${table} not found`;
}

const STORE = coded({
  db_missing,
  store_name_required,
  unregistered_schema,
  record_not_found,
  key_duplicate,
  table_not_found,
});

function pk_undefined(store: string) {
  return fail`${store}: store has no primary key`;
}
function pk_immutable(pk: string) {
  return fail`primary key ${pk} cannot be updated`;
}
function pk_duplicate(pk: string) {
  return fail`primary key ${pk} already exists`;
}
function pk_invalid(pk: unknown) {
  return fail`pk must be string, number or bigint, got ${kind_of(pk)}`;
}
function pk_required(table: string) {
  return fail`pk is required but has generate=${false} in table ${table}`;
}
function pk_multiple_pks(first: string, second: string) {
  return fail`multiple primary keys: ${first}, ${second}`;
}

const PK = coded({
  pk_undefined,
  pk_immutable,
  pk_duplicate,
  pk_invalid,
  pk_required,
  pk_multiple_pks,
});

type Context = "select" | "where" | "sort" | "insert" | "set";

function field_unknown(field: string, context: Context) {
  return fail`${field}: unknown field on ${context}`;
}
function field_duplicate(field: string, context: Context) {
  return fail`${field}: duplicate field on ${context}`;
}
function field_required(operator: string) {
  return fail`${operator}: at least one field required`;
}
function field_undefined(field: string, context: Context) {
  return fail`${field}: undefined value on ${context}`;
}
function fields_unknown(fields: string[]) {
  return fail`unknown fields ${fields}`;
}

const FIELD = coded({
  field_unknown,
  field_duplicate,
  field_required,
  field_undefined,
  fields_unknown,
});

function null_not_allowed(field: string) {
  return fail`${field}: null not allowed`;
}

const NULL = coded({
  null_not_allowed,
});

function wrong_type(
  type: "string" | "number" | "bigint" | "boolean" | "url" | "date" | "blob",
  field: string,
  got: unknown,
  op = "value",
) {
  return fail`${field}: ${op} requires ${type}, got ${kind_of(got)}`;
}

function operator_unknown(field: string, operator: string) {
  return fail`${field}: unknown operator ${operator}`;
}
function operator_empty(field: string) {
  return fail`${field}: empty operator`;
}
function operator_scalar(field: string) {
  return fail`${field}: operator requires scalar value`;
}

const OPERATOR = coded({
  operator_unknown,
  operator_empty,
  wrong_type,
  operator_scalar,
});

function sort_empty() {
  return fail`empty sort`;
}
function sort_invalid() {
  return fail`sort invalid`;
}
function sort_invalid_value(field: string, value: unknown) {
  return fail`${field}: invalid sort value, received ${kind_of(value)}`;
}
function select_empty() {
  return fail`empty select`;
}
function select_invalid() {
  return fail`invalid select`;
}
function limit_invalid() {
  return fail`invalid limit`;
}
function select_invalid_value(index: number, x: unknown) {
  return fail`select[${index}]: must be string, received ${kind_of(x)}`;
}
function where_required() {
  return fail`where required`;
}
function where_invalid() {
  return fail`where invalid`;
}
function where_invalid_value(field: string, value: unknown) {
  return fail`${field}: invalid where value, received ${kind_of(value)}`;
}
function set_empty() {
  return fail`empty set on update`;
}

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

function relation_unknown(relation: string) {
  return fail`unknown relation ${relation}`;
}
function relation_requires_pk(type: "target" | "parent") {
  return fail`relation loading requires ${type} primary key`;
}

function relation_conflicts_with_field(relation: string) {
  return fail`relation ${relation} conflicts with an existing schema field`;
}

const RELATION = coded({
  relation_unknown,
  relation_requires_pk,
  relation_conflicts_with_field,
});

function option_unknown(option: string) {
  return fail`unknown option ${option}`;
}
function identifier_invalid(identifier: string) {
  return fail`invalid identifier ${identifier}`;
}
function count_with_invalid() {
  return fail`${"count"} and ${"with"} are mutually exclusive`;
}
function count_overflow(table: string, count: unknown) {
  return fail`${table}: count overflow, received ${count} (max ${MAX_INT})`;
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
