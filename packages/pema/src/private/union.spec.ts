import bigint from "#bigint";
import type BigIntType from "#BigIntType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import type ConstructorType from "#ConstructorType";
import type DefaultType from "#DefaultType";
import type LiteralType from "#LiteralType";
import type ObjectType from "#ObjectType";
import string from "#string";
import type StringType from "#StringType";
import union from "#union";
import type UnionType from "#UnionType";
import test from "@rcompat/test";

test.case("less than 2 members", assert => {
  const error = "union type must have at least two members";
  // 0 members
  try {
    assert(union()).type<UnionType<[]>>();
  } catch {
    // noop
  }
  assert(() => union()).throws(error);

  // 1 member
  try {
    assert(union(string)).type<UnionType<[StringType]>>();
  } catch {
    // noop
  }
  assert(() => union(string)).throws(error);
});

test.case("flat", assert => {
  const bs = union(boolean, string);

  assert(bs).type<UnionType<[BooleanType, StringType]>>();
  assert(bs.parse("foo")).equals("foo").type<boolean | string>();
  assert(bs.parse(true)).equals(true).type<boolean | string>();
  const bs_e = "expected `boolean | string`, got `1` (number)";
  assert(() => bs.parse(1)).throws(bs_e);

  const fb = union("foo", "bar");
  assert(fb).type<UnionType<[LiteralType<"foo">, LiteralType<"bar">]>>();
  assert(fb.parse("foo")).equals("foo").type<"bar" | "foo">();
  assert(fb.parse("bar")).equals("bar").type<"bar" | "foo">();
  const fb_e = "expected `\"foo\" | \"bar\"`, got `1` (number)";
  assert(() => fb.parse(1)).throws(fb_e);
});

test.case("deep", assert => {
  const u = union(string, { bar: "baz", foo: bigint });
  const u_e = "string | { bar: \"baz\", foo: bigint }";

  assert(u).type<UnionType<[StringType, ObjectType<{
    bar: LiteralType<"baz">;
    foo: BigIntType;
  }>]>>();
  assert(u.parse("foo")).equals("foo")
    .type<{ bar: "baz"; foo: bigint } | string>();
  assert(() => u.parse(1)).throws(`expected \`${u_e}\`, got \`1\` (number)`);
});

test.case("classes", assert => {
  class Class { };
  const c = new Class();

  const u = union(string, Class);
  const u_e = "string | constructor";

  assert(u).type<UnionType<[StringType, ConstructorType<typeof Class>]>>();
  assert(u.parse("foo")).equals("foo").type<Class | string>();
  assert(u.parse(c)).equals(c).type<Class | string>();
  assert(() => u.parse(1)).throws(`expected \`${u_e}\`, got \`1\` (number)`);
});

test.case("default", assert => {
  const bs_def_s = union(boolean, string).default("foo");
  const bs_def_s1 = union(boolean, string).default(() => "foo");
  const bs_def_b = union(boolean, string).default(true);
  const bs_def_b1 = union(boolean, string).default(() => true);

  [bs_def_s, bs_def_s1, bs_def_b, bs_def_b1].forEach(type => {
    assert(type).type<DefaultType<
      UnionType<[BooleanType, StringType]>,
      boolean | string>
    >();
  });

  assert(bs_def_s.parse(undefined)).equals("foo");
  assert(bs_def_s1.parse(undefined)).equals("foo");
  assert(bs_def_b.parse(undefined)).equals(true);
  assert(bs_def_b1.parse(undefined)).equals(true);
});
