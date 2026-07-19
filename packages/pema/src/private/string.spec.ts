import type DefaultType from "#DefaultType";
import p from "#index";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import type StringType from "#StringType";
import test from "#test";

test.case("fail", assert => {
  assert(p.string).invalid_type([1, null, undefined, true, [], {}]);
});

test.case("pass", assert => {
  assert(p.string).type<StringType>();
  assert(p.string.parse("test")).equals("test").type<string>();
});

test.case("derive", assert => {
  const length = p.string.derive(value => value.length);

  assert(length.parse("hello")).equals(5).type<number>();
});

test.case("derive: async function returns unresolved promise", async assert => {
  const schema = p.string.derive(async value => value.length);
  const result = schema.parse("hello");

  assert(result instanceof Promise).true();
  assert(await result).equals(5).type<number>();
});

test.case("loose", assert => {
  assert(p.loose.string.parse("foo")).equals("foo").type<string>();
});

test.case("default", assert => {
  [p.string.default("foo"), p.string.default(() => "foo")].forEach(d => {
    assert(d).type<DefaultType<StringType, "foo">>();
    assert(d.parse(undefined)).equals("foo").type<string>();
    assert(d.parse("foo")).equals("foo").type<string>();
    assert(d.parse("bar")).equals("bar").type<string>();
    assert(d).invalid_type([1]);
  });

  const length = p.string.default("foo").derive(value => value.length);
  assert(length.parse(undefined)).equals(3).type<number>();
});

test.case("optional", assert => {
  const o = p.string.optional();
  assert(o).type<OptionalType<StringType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse("foo")).equals("foo").type<string>();
  assert(o).invalid_type([1]);
});

test.case("transform: trim", assert => {
  const schema = p.string.trim();

  assert(schema).type<StringType>();
  assert(schema.parse(" foo ")).equals("foo").type<string>();
  assert(schema.parse("\tfoo\n")).equals("foo").type<string>();
});

test.case("transform: lowercase", assert => {
  const schema = p.string.lowercase();

  assert(schema).type<StringType>();
  assert(schema.parse("FoO")).equals("foo").type<string>();
});

test.case("transform: uppercase", assert => {
  const schema = p.string.uppercase();

  assert(schema).type<StringType>();
  assert(schema.parse("FoO")).equals("FOO").type<string>();
});

test.case("transform: before validators", assert => {
  const schema = p.string.trim().lowercase().regex(/^foo$/);

  assert(schema.parse(" FOO ")).equals("foo").type<string>();
  assert(schema).invalid_format([" BAR "]);
});

test.case("check", assert => {
  const schema = p.string.check(
    value => /^[a-z][a-z0-9]{2,31}$/.test(value),
    "Use 3-32 lowercase letters or numbers, starting with a letter",
  );

  assert(schema).type<StringType>();
  assert(schema.parse("abc123")).equals("abc123").type<string>();
  try {
    schema.parse("ab");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message)
      .equals("Use 3-32 lowercase letters or numbers, starting with a letter");
  }
});

test.case("check: after transforms", assert => {
  const schema = p.string
    .trim()
    .lowercase()
    .check(
      value => /^[a-z][a-z0-9]{2,31}$/.test(value),
      "Use 3-32 lowercase letters or numbers, starting with a letter",
    );

  assert(schema.parse(" ABC123 ")).equals("abc123").type<string>();
});

test.case("validator: startsWith", assert => {
  const sw = p.string.startsWith("/");

  assert(sw).type<StringType>();
  assert(sw.parse("/")).equals("/").type<string>();
  assert(sw.parse("/foo")).equals("/foo").type<string>();
  assert(sw).invalid_format(["foo"]);
});

test.case("validator: startsWith custom message", assert => {
  const sw = p.string.startsWith("/", "Must start with a slash");

  try {
    sw.parse("foo");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("Must start with a slash");
  }
});

test.case("validator: endsWith", assert => {
  const ew = p.string.endsWith("/");

  assert(ew).type<StringType>();
  assert(ew.parse("/")).equals("/").type<string>();
  assert(ew.parse("foo/")).equals("foo/").type<string>();
  assert(ew).invalid_format(["foo"]);
});

test.case("validator: email", assert => {
  const email = p.string.email();
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

test.case("validator: email custom message", assert => {
  const email = p.string.email({ message: "Enter a valid email" });

  try {
    email.parse("nope");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("Enter a valid email");
  }
});

test.case("validator: min", assert => {
  assert(() => p.string.min(-10)).throws(Code.min_negative);
  assert(() => p.string.min(Infinity)).throws(Code.min_limit_not_finite);
  assert(() => p.string.min(NaN)).throws(Code.min_limit_not_finite);
  const min = p.string.min(5);
  assert(min.parse("hello")).equals("hello").type<string>();
  assert(min.parse("universe")).equals("universe").type<string>();
  assert(min).too_small(["hi"]);

  const trimmed = min.derive(value => value.trim());
  assert(trimmed.parse(" hello ")).equals("hello").type<string>();
});

test.case("validator: min custom message", assert => {
  const min = p.string.min(5, "Too short");

  try {
    min.parse("hi");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("Too short");
  }
});

test.case("validator: max", assert => {
  assert(() => p.string.max(-10)).throws(Code.max_negative);
  assert(() => p.string.max(Infinity)).throws(Code.max_limit_not_finite);
  assert(() => p.string.max(NaN)).throws(Code.max_limit_not_finite);
  const max = p.string.max(5);
  assert(max.parse("hello")).equals("hello").type<string>();
  assert(max.parse("hi")).equals("hi").type<string>();
  assert(max).too_large(["universe"]);
});

test.case("validator: max custom message", assert => {
  const max = p.string.max(5, { message: value => `${value} is too long` });

  try {
    max.parse("universe");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("universe is too long");
  }
});

test.case("validator: length", assert => {
  assert(() => p.string.length(Infinity, 10)).throws(Code.length_not_finite);
  assert(() => p.string.length(-10, 10)).throws(Code.length_not_positive);
  assert(() => p.string.length(10, -10)).throws(Code.length_not_positive);
  assert(() => p.string.length(5, 3)).throws(Code.length_from_exceeds_to);
  const length = p.string.length(0, 5);
  assert(length.parse("hello")).equals("hello").type<string>();
  assert(length.parse("hi")).equals("hi").type<string>();
  assert(length.parse("")).equals("").type<string>();
  assert(length).out_of_range(["universe"]);
});

test.case("validator: length custom message", assert => {
  const length = p.string.length(3, 5, "Use 3-5 characters");

  try {
    length.parse("hi");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("Use 3-5 characters");
  }
});

test.case("validator: regex custom message", assert => {
  const regex = p.string.regex(/^[a-z]+$/, {
    message: "Use lowercase letters",
  });

  try {
    regex.parse("ABC");
    assert(false).true();
  } catch (error) {
    assert((error as Error).message).equals("Use lowercase letters");
  }
});

test.case("combined validators", assert => {
  const combined = p.string.startsWith("/").endsWith(".");

  assert(combined).type<StringType>();
  assert(combined.parse("/.")).equals("/.").type<string>();
  assert(combined.parse("/foo.")).equals("/foo.").type<string>();
  assert(combined).invalid_format(["foo", "foo.", "/foo"]);
});

test.case("toJSON", assert => {
  assert(p.string.toJSON())
    .type<{ type: "string"; datatype: "string" }>()
    .equals({ type: "string", datatype: "string" })
    ;
});
