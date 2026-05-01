import p from "#index";
import type NumberType from "#NumberType";
import type RecordType from "#RecordType";
import type StringType from "#StringType";
import type SymbolType from "#SymbolType";
import test from "#test";

const foo_sym = Symbol("foo");

test.case("base", assert => {
  const r = p.record(p.string, p.string);
  assert(r).invalid_type([1]);
});

test.case("string key", assert => {
  const r = p.record(p.string, p.string);

  assert(r).type<RecordType<StringType, StringType>>();
  assert(r.parse({ foo: "bar" })).type<Record<string, string>>()
    .equals({ foo: "bar" });

  // p.symbol key on p.record(string, string)
  assert(r).invalid_type([{ [foo_sym]: "foo" }]);

  // p.number key on p.record(string, string)
  assert(r).invalid_type([{ 0: "foo" }], "/0");

  // false value
  assert(r).invalid_type([{ foo: 1 }], "/foo");
});

test.case("p.number key", assert => {
  const r = p.record(p.number, p.string);

  assert(r).type<RecordType<NumberType, StringType>>();
  assert(r.parse({ 0: "bar" })).type<Record<number, string>>()
    .equals({ 0: "bar" });

  // p.symbol key on p.record(p.number, string)
  /*assert(r).invalid_type([{ [foo_sym]: "foo" }]);

  // string key on p.record(p.number, string)
  assert(r).invalid_type([{ foo: "foo" }], "/foo");

  // invalid value at numeric key
  assert(r).invalid_type([{ 1: "1" }], "/1");*/
});

test.case("p.symbol key", assert => {
  const r = p.record(p.symbol, p.string);

  assert(r).type<RecordType<SymbolType, StringType>>();
  assert(r.parse({ [foo_sym]: "bar" })).type<Record<symbol, string>>()
    .equals({ [foo_sym]: "bar" });
  assert(r).invalid_type([{ [foo_sym]: 1 }]);
});
