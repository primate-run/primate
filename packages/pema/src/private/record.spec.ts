import number from "#number";
import type NumberType from "#NumberType";
import record from "#record";
import type RecordType from "#RecordType";
import string from "#string";
import type StringType from "#StringType";
import symbol from "#symbol";
import type SymbolType from "#SymbolType";
import test from "#test";

const foo_sym = Symbol("foo");

test.case("base", assert => {
  const r = record(string, string);
  assert(r).invalid_type([1]);
});

test.case("string key", assert => {
  const r = record(string, string);

  assert(r).type<RecordType<StringType, StringType>>();
  assert(r.parse({ foo: "bar" })).type<Record<string, string>>()
    .equals({ foo: "bar" });

  // symbol key on record(string, string)
  assert(r).invalid_type([{ [foo_sym]: "foo" }]);

  // number key on record(string, string)
  assert(r).invalid_type([{ 0: "foo" }], "/0");

  // false value
  assert(r).invalid_type([{ foo: 1 }], "/foo");
});

test.case("number key", assert => {
  const r = record(number, string);

  assert(r).type<RecordType<NumberType, StringType>>();
  assert(r.parse({ 0: "bar" })).type<Record<number, string>>()
    .equals({ 0: "bar" });

  // symbol key on record(number, string)
  /*assert(r).invalid_type([{ [foo_sym]: "foo" }]);

  // string key on record(number, string)
  assert(r).invalid_type([{ foo: "foo" }], "/foo");

  // invalid value at numeric key
  assert(r).invalid_type([{ 1: "1" }], "/1");*/
});

test.case("symbol key", assert => {
  const r = record(symbol, string);

  assert(r).type<RecordType<SymbolType, StringType>>();
  assert(r.parse({ [foo_sym]: "bar" })).type<Record<symbol, string>>()
    .equals({ [foo_sym]: "bar" });
  assert(r).invalid_type([{ [foo_sym]: 1 }]);
});
