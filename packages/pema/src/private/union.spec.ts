import type BigIntType from "#BigIntType";
import type BooleanType from "#BooleanType";
import type ConstructorType from "#ConstructorType";
import type DefaultType from "#DefaultType";
import p from "#index";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type NumberType from "#NumberType";
import type ObjectType from "#ObjectType";
import type OptionalType from "#OptionalType";
import { Code } from "#schema-errors";
import type StringType from "#StringType";
import test from "#test";
import type UnionType from "#UnionType";

test.case("less than 2 members", assert => {
  // 0 members
  try {
    assert(p.union()).type<UnionType<[]>>();
  } catch {
    // noop
  }
  assert(() => p.union()).throws(Code.union_at_least_two_members);

  // 1 member
  try {
    assert(p.union(p.string)).type<UnionType<[StringType]>>();
  } catch {
    // noop
  }
  assert(() => p.union(p.string)).throws(Code.union_at_least_two_members);
});

test.case("flat", assert => {
  const bs = p.union(p.boolean, p.string);

  assert(bs).type<UnionType<[BooleanType, StringType]>>();
  assert(bs.parse("foo")).equals("foo").type<boolean | string>();
  assert(bs.parse(true)).equals(true).type<boolean | string>();
  assert(bs).invalid_type([1]);

  const fb = p.union("foo", "bar");
  assert(fb).type<UnionType<[LiteralType<"foo">, LiteralType<"bar">]>>();
  assert(fb.parse("foo")).equals("foo").type<"bar" | "foo">();
  assert(fb.parse("bar")).equals("bar").type<"bar" | "foo">();
  assert(fb).invalid_type([1]);
});

test.case("deep", assert => {
  const u = p.union(p.string, { bar: "baz", foo: p.bigint });

  assert(u).type<UnionType<[StringType, ObjectType<{
    bar: LiteralType<"baz">;
    foo: BigIntType;
  }>]>>();
  assert(u.parse("foo")).equals("foo")
    .type<{ bar: "baz"; foo: bigint } | string>();
  assert(u).invalid_type([1]);
});

test.case("classes", assert => {
  class Class { };
  const c = new Class();
  const u = p.union(p.string, Class);

  assert(u).type<UnionType<[StringType, ConstructorType<typeof Class>]>>();
  assert(u.parse("foo")).equals("foo").type<Class | string>();
  assert(u.parse(c)).equals(c).type<Class | string>();
  assert(u).invalid_type([1]);
});

test.case("default", assert => {
  const bs_def_s = p.union(p.boolean, p.string).default("foo");
  const bs_def_s1 = p.union(p.boolean, p.string).default(() => "foo");
  const bs_def_b = p.union(p.boolean, p.string).default(true);
  const bs_def_b1 = p.union(p.boolean, p.string).default(() => true);

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

test.case("nullable", assert => {
  const sn = p.union(p.string, null);
  assert(sn).type<UnionType<[StringType, NullType]>>();
  assert(sn.parse("foo")).equals("foo").type<string | null>();
  assert(sn.parse(null)).equals(null);
  assert(sn).invalid_type([undefined]);
});

test.case("optional", assert => {
  const u = p.union(p.string.optional(), p.number);
  assert(u).type<UnionType<[OptionalType<StringType>, NumberType]>>();
  assert(u.parse("foo")).equals("foo")/*.type<string | p.number | undefined>()*/;
  assert(u.parse(42)).equals(42);
  assert(u.parse(undefined)).equals(undefined);
});
