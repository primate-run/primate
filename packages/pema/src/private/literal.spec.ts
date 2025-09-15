import type LiteralType from "#LiteralType";
import literal from "#literal";
import test from "@rcompat/test";

test.case("strings", assert => {
  const foo = literal("foo");

  assert(foo).type<LiteralType<"foo">>();
  assert(foo.parse("foo")).type<"foo">();

  const error = "expected \"foo\", got `true` (boolean)";
  assert(() => foo.parse(true)).throws(error);
});

test.case("numbers", assert => {
  const foo = literal(1);

  assert(foo).type<LiteralType<1>>();
  assert(foo.parse(1)).type<1>();

  const error = "expected 1, got `2` (number)";
  assert(() => foo.parse(2)).throws(error);
});

test.case("booleans", assert => {
  const t = literal(true);
  const f = literal(false);

  assert(t).type<LiteralType<true>>();
  assert(f).type<LiteralType<false>>();
  assert(t.parse(true)).type<true>();
  assert(f.parse(false)).type<false>();

  assert(() => t.parse(false)).throws("expected true, got `false` (boolean)");
  assert(() => f.parse(true)).throws("expected false, got `true` (boolean)");
});
