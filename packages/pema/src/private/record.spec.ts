import expect from "#expect";
import number from "#number";
import type NumberType from "#NumberType";
import type ParseError from "#ParseError";
import record from "#record";
import type RecordType from "#RecordType";
import string from "#string";
import type StringType from "#StringType";
import symbol from "#symbol";
import type SymbolType from "#SymbolType";
import test from "@rcompat/test";

const types = {
  n: "number",
  o: "object",
  s: "string",
  sy: "symbol",
};

const prefix = (at: string) => at ? `${at}: ` : "";
const expect_key = (type: keyof typeof types, got: unknown, at = "") => {
  const expected = `${prefix(at)}expected ${types[type]} key`;
  return `${expected}, got \`${(got as string).toString()}\` (${typeof got})`;
};

test.case("base", assert => {
  const r = record(string, string);
  assert(() => r.parse(1)).throws(expect("o", 1));
});

test.case("string key", assert => {
  const r = record(string, string);

  assert(r).type<RecordType<StringType, StringType>>();
  assert(r.parse({ foo: "bar" })).type<Record<string, string>>()
    .equals({ foo: "bar" });
  // false key
  const foo = Symbol("foo");
  assert(() => r.parse({ [foo]: "foo" })).throws(expect_key("s", foo));
  assert(() => r.parse({ 0: "foo" })).throws(expect_key("s", 0));

  // false value
  try {
    r.parse({ foo: 1 });
  } catch (error) {
    assert((error as ParseError).issues).equals([{
      input: 1,
      key: "foo",
      message: "expected string, got `1` (number)",
    }]);
  }
});

test.case("number key", assert => {
  const r = record(number, string);

  assert(r).type<RecordType<NumberType, StringType>>();
  assert(r.parse({ 0: "bar" })).type<Record<number, string>>()
    .equals({ 0: "bar" });

  // false key
  const foo = Symbol("foo");
  assert(() => r.parse({ [foo]: "foo" })).throws(expect_key("n", foo));
  assert(() => r.parse({ foo: "foo" })).throws(expect_key("n", "foo"));
  // false value
  assert(() => r.parse({ 1: 1 })).throws(expect("s", 1, 1));
});

test.case("symbol key", assert => {
  const r = record(symbol, string);
  const foo = Symbol("foo");

  assert(r).type<RecordType<SymbolType, StringType>>();
  assert(r.parse({ [foo]: "bar" })).type<Record<symbol, string>>()
    .equals({ [foo]: "bar" });
  // false value
  assert(() => r.parse({ [foo]: 1 })).throws(expect("s", 1, "Symbol(foo)"));
});
