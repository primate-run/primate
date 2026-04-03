import type DefaultType from "#DefaultType";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import string from "#string";
import type StringType from "#StringType";
import test from "#test";

test.case("fail", assert => {
  assert(string).invalid_type([1, null, undefined, true, [], {}]);
});

test.case("pass", assert => {
  assert(string).type<StringType>();
  assert(string.parse("test")).equals("test").type<string>();
});

test.case("default", assert => {
  [string.default("foo"), string.default(() => "foo")].forEach(d => {
    assert(d).type<DefaultType<StringType, "foo">>();
    assert(d.parse(undefined)).equals("foo").type<string>();
    assert(d.parse("foo")).equals("foo").type<string>();
    assert(d.parse("bar")).equals("bar").type<string>();
    assert(d).invalid_type([1]);
  });
});

test.case("optional", assert => {
  const o = string.optional();
  assert(o).type<OptionalType<StringType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse("foo")).equals("foo").type<string>();
  assert(o).invalid_type([1]);
});

test.case("validator: startsWith", assert => {
  const sw = string.startsWith("/");

  assert(sw).type<StringType>();
  assert(sw.parse("/")).equals("/").type<string>();
  assert(sw.parse("/foo")).equals("/foo").type<string>();
  assert(sw).invalid_format(["foo"]);
});

test.case("validator: endsWith", assert => {
  const ew = string.endsWith("/");

  assert(ew).type<StringType>();
  assert(ew.parse("/")).equals("/").type<string>();
  assert(ew.parse("foo/")).equals("foo/").type<string>();
  assert(ew).invalid_format(["foo"]);
});

test.case("validator: email", assert => {
  const email = string.email();
  assert(email).type<StringType>();
  assert(email).invalid_format([
    "4d0996 b-BDA9-4f95-ad7c-7075b10d4ba6",
    "a@b",
    "c.com",
  ]);

  const pass = "John.Doe@example.com";
  [pass, pass.toLowerCase(), pass.toUpperCase()].forEach(passing => {
    assert(email.parse(passing)).equals(passing);
  });
});

test.case("validator: min", assert => {
  assert(() => string.min(-10)).throws(Code.min_negative);
  assert(() => string.min(Infinity)).throws(Code.min_limit_not_finite);
  assert(() => string.min(NaN)).throws(Code.min_limit_not_finite);
  const min = string.min(5);
  assert(min.parse("hello")).equals("hello").type<string>();
  assert(min.parse("universe")).equals("universe").type<string>();
  assert(min).too_small(["hi"]);
});
test.case("validator: max", assert => {
  assert(() => string.max(-10)).throws(Code.max_negative);
  assert(() => string.max(Infinity)).throws(Code.max_limit_not_finite);
  assert(() => string.max(NaN)).throws(Code.max_limit_not_finite);
  const max = string.max(5);
  assert(max.parse("hello")).equals("hello").type<string>();
  assert(max.parse("hi")).equals("hi").type<string>();
  assert(max).too_large(["universe"]);
});
test.case("validator: length", assert => {
  assert(() => string.length(Infinity, 10)).throws(Code.length_not_finite);
  assert(() => string.length(-10, 10)).throws(Code.length_not_positive);
  assert(() => string.length(10, -10)).throws(Code.length_not_positive);
  assert(() => string.length(5, 3)).throws(Code.length_from_exceeds_to);
  const length = string.length(0, 5);
  assert(length.parse("hello")).equals("hello").type<string>();
  assert(length.parse("hi")).equals("hi").type<string>();
  assert(length.parse("")).equals("").type<string>();
  assert(length).out_of_range(["universe"]);
});

test.case("combined validators", assert => {
  const combined = string.startsWith("/").endsWith(".");

  assert(combined).type<StringType>();
  assert(combined.parse("/.")).equals("/.").type<string>();
  assert(combined.parse("/foo.")).equals("/foo.").type<string>();
  assert(combined).invalid_format(["foo", "foo.", "/foo"]);
});

test.case("toJSON", assert => {
  assert(string.toJSON())
    .type<{ type: "string"; datatype: "string" }>()
    .equals({ type: "string", datatype: "string" })
    ;
});
