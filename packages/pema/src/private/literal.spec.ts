import type DefaultType from "#DefaultType";
import type LiteralType from "#LiteralType";
import type OptionalType from "#OptionalType";
import literal from "#literal";
import test from "#test";

test.case("strings", assert => {
  const foo = literal("foo");
  assert(foo).type<LiteralType<"foo">>();
  assert(foo.parse("foo")).type<"foo">();
  assert(foo).invalid_type([true, 1, null, undefined, "bar"]);
});

test.case("numbers", assert => {
  const foo = literal(1);
  assert(foo).type<LiteralType<1>>();
  assert(foo.parse(1)).type<1>();
  assert(foo).invalid_type([2, "1", true, null, undefined]);
});

test.case("booleans", assert => {
  for (const bool of [true, false] as const) {
    const t = literal(bool);
    assert(t).type<LiteralType<typeof bool>>();
    assert(t.parse(bool)).type<typeof bool>();
    assert(t).invalid_type([!bool, String(bool), null, undefined]);
  }
});

test.case("default", assert => {
  const d = literal("foo").default("foo");
  assert(d).type<DefaultType<LiteralType<"foo">, "foo">>();
  assert(d.parse(undefined)).equals("foo").type<"foo">();
  assert(d.parse("foo")).equals("foo").type<"foo">();
  assert(d).invalid_type(["bar"]);
});

test.case("optional", assert => {
  const o = literal("foo").optional();
  assert(o).type<OptionalType<LiteralType<"foo">>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse("foo")).equals("foo");
  assert(o).invalid_type(["bar"]);
});

test.case("toJSON", assert => {
  assert(literal("foo").toJSON())
    .type<{ type: "literal"; value: "foo" }>()
    .equals({ type: "literal", value: "foo" });
  assert(literal(1).toJSON())
    .type<{ type: "literal"; value: 1 }>()
    .equals({ type: "literal", value: 1 });
  assert(literal(true).toJSON())
    .type<{ type: "literal"; value: true }>()
    .equals({ type: "literal", value: true });
});
