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
import messagesOf from "#test/messages-of";
import pathsOf from "#test/paths-of";
import throwsIssues from "#test/throws-issues";
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
  {
    // symbol key on record(string, string)
    const issues = throwsIssues(assert, () => r.parse({ [foo]: "foo" }));
    // JSON Pointer cannot address a symbol key -> anchor at the record itself
    assert(pathsOf(issues)).equals([""]);                   // root
    // keep your existing message helper for keys
    assert(messagesOf(issues)).equals([expect_key("s", foo)]);
  }

  {
    // number key on record(string, string) -> property "0"
    const issues = throwsIssues(assert, () => r.parse({ 0: "foo" }));
    // this points at the offending key
    assert(pathsOf(issues)).equals(["/0"]);
    assert(messagesOf(issues)).equals([expect_key("s", 0)]);
  }

  // false value
  try {
    r.parse({ foo: 1 });
  } catch (error) {
    assert((error as ParseError).issues).equals([{
      input: 1,
      message: "expected string, got `1` (number)",
      path: "/foo",
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

  {
    // symbol key on record(number, string)
    const issues = throwsIssues(assert, () => r.parse({ [foo]: "foo" }));
    // JSON Pointer can't address symbol keys -> anchor at the record (root)
    assert(pathsOf(issues)).equals([""]);
    assert(messagesOf(issues)).equals([expect_key("n", foo)]);
  }

  {
    // string key on record(number, string)
    const issues = throwsIssues(assert, () => r.parse({ foo: "foo" }));
    // point directly at the offending key
    assert(pathsOf(issues)).equals(["/foo"]);
    assert(messagesOf(issues)).equals([expect_key("n", "foo")]);
  }

  // false value
  {
    // invalid value type at numeric key
    const issues = throwsIssues(assert, () => r.parse({ 1: 1 }));
    // key "1" is valid; the value is wrong -> path is that key
    assert(pathsOf(issues)).equals(["/1"]);
    assert(messagesOf(issues)).equals([expect("s", 1)]);
  }
});

test.case("symbol key", assert => {
  const r = record(symbol, string);
  const foo = Symbol("foo");

  assert(r).type<RecordType<SymbolType, StringType>>();
  assert(r.parse({ [foo]: "bar" })).type<Record<symbol, string>>()
    .equals({ [foo]: "bar" });
  // false value
  {
    const issues = throwsIssues(assert, () => r.parse({ [foo]: 1 }));
    assert(pathsOf(issues)).equals([""]);
    assert(messagesOf(issues)).equals([expect("s", 1)]);
  }
});
