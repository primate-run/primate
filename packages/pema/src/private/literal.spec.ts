import type LiteralType from "#LiteralType";
import literal from "#literal";
import test from "@rcompat/test";

test.case("strings", assert => {
  const foo = literal("foo");

  assert(foo).type<LiteralType<"foo">>();
  assert(foo.parse("foo")).type<"foo">();

  const error = "expected literal 'foo', got `true` (boolean)";
  assert(() => foo.parse(true)).throws(error);
});
