import error from "@rcompat/error";

const MAX_INT = Number.MAX_SAFE_INTEGER;
const t = error.template;

function kind_of(x: unknown) {
  if (x === null) return "null";
  if (x instanceof Date) return "Date";
  if (x instanceof URL) return "URL";
  if (x instanceof Blob) return "Blob";
  return typeof x;
}

function db_missing() {
  return t`database missing`;
}
function store_directory_missing() {
  return t`store directory missing`;
}
function store_directory_empty() {
  return t`store directory empty`;
}
function store_table_required() {
  return t`store ${"table"} required`;
}
function unregistered_schema() {
  return t`no store registered for schema`;
}
function record_not_found(field: string, value: string | number | bigint) {
  return t`no record with ${field} = ${value}`;
}
function key_duplicate(key: string) {
  return t`key ${key} already exists`;
}
function table_not_found(table: string) {
  return t`table ${table} not found`;
}
type RecordCountInvalidContext = "get" | "update" | "delete" | "count";
function record_number_invalid(n: number, context: RecordCountInvalidContext) {
  return t`${context}: record number invalid (${n} instead of 1)`;
}
function return_invalid(got: unknown,
  expected: string,
  context: RecordCountInvalidContext) {
  return t`${context} returned ${typeof got}, expected ${expected}`;
}

const STORE = error.coded({
  db_missing,
  store_directory_missing,
  store_directory_empty,
  store_table_required,
  unregistered_schema,
  record_not_found,
  record_number_invalid,
  return_invalid,
  key_duplicate,
  table_not_found,
});

function pk_undefined(store: string) {
  return t`${store}: store has no primary key`;
}
function pk_immutable(pk: string) {
  return t`primary key ${pk} cannot be updated`;
}
function pk_duplicate(pk: string) {
  return t`primary key ${pk} already exists`;
}
function pk_invalid(pk: unknown) {
  return t`pk value ${pk} (${kind_of(pk)}) does not match the expected type`;
}
function pk_required(table: string) {
  return t`primary key is required but has generate=${false} in table ${table}`;
}
function pk_multiple_pks(first: string, second: string) {
  return t`multiple primary keys: ${first}, ${second}`;
}
function pk_invalid_type(datatype: string) {
  return t`primary key type ${datatype} not allowed; use unsigned integers or p.uuid`;
}

const PK = error.coded({
  pk_undefined,
  pk_immutable,
  pk_duplicate,
  pk_invalid,
  pk_required,
  pk_multiple_pks,
  pk_invalid_type,
});

type Context = "select" | "where" | "sort" | "insert" | "set" | "unbind";

function field_unknown(field: string, context: Context) {
  return t`${field}: unknown field on ${context}`;
}
function field_duplicate(field: string, context: Context) {
  return t`${field}: duplicate field on ${context}`;
}
function field_required(operator: string) {
  return t`${operator}: at least one field required`;
}
function field_undefined(field: string, context: Context) {
  return t`${field}: undefined value on ${context}`;
}
function fields_unknown(fields: string[]) {
  return t`unknown fields ${fields}`;
}

const FIELD = error.coded({
  field_unknown,
  field_duplicate,
  field_required,
  field_undefined,
  fields_unknown,
});

function null_not_allowed(field: string) {
  return t`${field}: null not allowed`;
}

const NULL = error.coded({
  null_not_allowed,
});

function wrong_type(
  type: "string" | "number" | "bigint" | "boolean" | "url" | "date" | "blob" | "array",
  field: string,
  got: unknown,
  op = "value",
) {
  return t`${field}: ${op} requires ${type}, got ${kind_of(got)}`;
}

function operator_unknown(field: string, operator: string) {
  return t`${field}: unknown operator ${operator}`;
}
function operator_empty(field: string) {
  return t`${field}: empty operator`;
}
function operator_scalar(field: string) {
  return t`${field}: operator requires scalar value`;
}
function operator_empty_in(key: string) {
  return t`$in operator on ${key} requires a non-empty array`;
}

const OPERATOR = error.coded({
  operator_unknown,
  operator_empty,
  wrong_type,
  operator_scalar,
  operator_empty_in,
});

function sort_empty() {
  return t`empty sort`;
}
function sort_invalid() {
  return t`sort invalid`;
}
function sort_invalid_value(field: string, value: unknown) {
  return t`${field}: invalid sort value, received ${kind_of(value)}`;
}
function select_empty() {
  return t`empty select`;
}
function select_invalid() {
  return t`invalid select`;
}
function limit_invalid() {
  return t`invalid limit`;
}
function select_invalid_value(index: number, x: unknown) {
  return t`select[${index}]: must be string, received ${kind_of(x)}`;
}
function where_required() {
  return t`where required`;
}
function where_invalid() {
  return t`where invalid`;
}
function where_invalid_value(field: string, value: unknown) {
  return t`${field}: invalid where value, received ${kind_of(value)}`;
}
function set_empty() {
  return t`empty set on update`;
}
function offset_invalid() {
  return t`offset must be a non-negative integer`;
}
function offset_requires_limit() {
  return t`offset requires limit to be set`;
}

const QUERY = error.coded({
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
  offset_invalid,
  offset_requires_limit,
});

function relation_unknown(relation: PropertyKey) {
  return t`unknown relation ${relation}`;
}
function relation_requires_pk(type: "target" | "parent") {
  return t`relation loading requires ${type} primary key`;
}
function relation_table_mismatch(expected: string, actual: string) {
  return t`relation table mismatch: expected ${expected}, got ${actual}`;
}
function relation_store_required(name: PropertyKey) {
  return t`relation ${name} requires a store`;
}

const RELATION = error.coded({
  relation_unknown,
  relation_requires_pk,
  relation_table_mismatch,
  relation_store_required,
});

function option_unknown(option: string) {
  return t`unknown option ${option}`;
}
function identifier_invalid(identifier: string) {
  return t`invalid identifier ${identifier}`;
}
function count_with_invalid() {
  return t`${"count"} and ${"with"} are mutually exclusive`;
}
function count_overflow(table: string, count: unknown) {
  return t`${table}: count overflow, received ${count} (max ${MAX_INT})`;
}
function migration_directory_missing() {
  return t`missing ${"migrations"} directory`;
}
function migration_store_conflict(message: string) {
  return t`multiple migratable stores share the same table:\n${message}`;
}
function unapplied_migrations() {
  return t`You have unapplied migrations.
— Show migration status ${"npx primate migrate:status"}
- Apply pending migrations ${"npx primate migrate:apply"}`;
}

const MISC = error.coded({
  option_unknown,
  identifier_invalid,
  count_with_invalid,
  count_overflow,
  migration_directory_missing,
  migration_store_conflict,
  unapplied_migrations,
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

export const Code = error.names(errors);
export type Code = keyof typeof errors;

export default errors;
