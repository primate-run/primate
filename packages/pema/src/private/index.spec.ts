import array from "#array";
import type ArrayType from "#ArrayType";
import bigint from "#bigint";
import blob from "#blob";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import date from "#date";
import file from "#file";
import schema from "#index";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import number from "#number";
import type NumberType from "#NumberType";
import type ObjectType from "#ObjectType";
import partial from "#partial";
import type PartialType from "#PartialType";
import string from "#string";
import type StringType from "#StringType";
import symbol from "#symbol";
import test from "#test";
import tuple from "#tuple";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type { EmptyDict } from "@rcompat/type";

const types = [
  [bigint, 0n, 0],
  [blob, new Blob(), 0],
  [boolean, false, "0"],
  [date, new Date(), "0"],
  [number, 0, "0"],
  [string, "0", 0],
  [symbol, Symbol(), 0],
  [file, new File([""], ""), 0],
] as const;

test.case("primitive validators", assert => {
  types.forEach(([parsed, good, bad]) => {
    const s = schema(parsed);
    assert(s.parse(good)).equals(good);
    assert(s).invalid_type([bad]);
  });
});

test.case("literals", assert => {
  const foo = schema("foo");
  assert(foo).type<LiteralType<"foo">>();
  assert(foo.parse("foo")).equals("foo").type<"foo">();
  const t = schema(true);
  assert(t).type<LiteralType<true>>();
  assert(t.parse(true)).equals(true).type<true>();
  assert(t).invalid_type([false]);
  const f = schema(false);
  assert(f).type<LiteralType<false>>();
  assert(f.parse(false)).equals(false).type<false>();
  assert(f).invalid_type([true]);
});

test.case("empty []", assert => {
  const s = schema([]);
  assert(s).type<TupleType<[]>>();
  assert(s.parse([])).equals([]).type<[]>();
});

test.case("empty {}", assert => {
  const s = schema({});
  assert(s).type<ObjectType<EmptyDict>>();
  assert(s.parse({})).equals({}).type<EmptyDict>();
});

test.case("object", assert => {
  const o = { foo: "bar" };
  type O = { foo: string };
  const o1 = { bar: { baz: 0 }, foo: "bar" };
  type O1 = { bar: { baz: number }; foo: string };

  const s = schema({ foo: string });
  const s1 = schema({ bar: { baz: number }, foo: string });

  assert<typeof s>().type<ObjectType<{ foo: StringType }>>();
  assert(s.parse(o)).equals(o).type<O>();

  assert(s1).type<ObjectType<{
    bar: ObjectType<{ baz: NumberType }>; foo: StringType;
  }>>();
  assert(s1.parse(o1)).equals(o1).type<O1>();
  //  assert(() => s.parse(1)).throws("Expected object");
  // assert(() => s.parse(1)).throws("Expected object");
});

test.case("array", assert => {
  const g0: unknown[] = [];
  const g1 = ["f"];
  const g2 = ["f", "f"];

  const b0 = [false];
  const b1 = ["f", 0];

  const s = schema(array(string));
  const si = schema([string]);

  for (const type of [s, si]) {
    assert(type).type<ArrayType<StringType>>();
    assert(type.parse(g0)).equals(g0).type<string[]>();
    assert(type.parse(g1)).equals(g1).type<string[]>();
    assert(type.parse(g2)).equals(g2).type<string[]>();
    assert(type).invalid_type([b0], "/0");
    assert(type).invalid_type([b1], "/1");
    assert(type).invalid_type([1]);
  }
});

test.case("tuple", assert => {
  const g0 = ["f", 0];

  const b0: unknown[] = [];
  const b1 = ["f"];
  const b2 = [0];
  const b3 = [0, "f"];

  const s = schema(tuple(string, number));
  const si = schema([string, number]);
  const snb = schema([string, number, boolean]);

  assert(s).type<TupleType<[StringType, NumberType]>>();
  assert(s.parse(g0)).equals(g0).type<[string, number]>();

  assert(si).type<TupleType<[StringType, NumberType]>>();
  assert(si.parse(g0)).equals(g0).type<[string, number]>();

  assert(snb).type<TupleType<[StringType, NumberType, BooleanType]>>();

  for (const type of [s, si]) {
    assert(type).invalid_type([b0, b2, b3], "/0");
    assert(type).invalid_type([b1], "/1");
  }
});

test.case("complex", assert => {
  const complex = schema({
    name: string,
    scores: array(number),
    tupled: tuple(string, boolean),
  });
  const complexi = schema({
    name: string,
    scores: [number],
    tupled: [string, boolean],
  });

  const valid = { name: "John", scores: [1, 2, 3], tupled: ["yes", true] };
  const invalid = { name: "Bob", scores: ["oops"], tupled: ["ok", "nope"] };

  type Expected = {
    name: string;
    scores: number[];
    tupled: [string, boolean];
  };
  type ExpectSchema = ObjectType<{
    name: StringType;
    scores: ArrayType<NumberType>;
    tupled: TupleType<[StringType, BooleanType]>;
  }>;

  for (const type of [complex, complexi]) {
    assert(type).type<ExpectSchema>();
    assert(type.parse(valid)).equals(valid).type<Expected>;
    assert(type).invalid_type([invalid], "/scores/0");

  }
});

test.case("null/undefined", assert => {
  assert(schema(null)).type<NullType>();
  assert(schema(null).parse(null)).equals(null).type<null>();
  assert(schema(null)).invalid_type(["null"]);
  assert(schema(undefined)).type<UndefinedType>();
  assert(schema(undefined).parse(undefined)).equals(undefined)
    .type<undefined>();
  assert(schema(undefined)).invalid_type([null]);
});

test.case("partial", assert => {
  const p = partial({ bar: number, foo: string });
  assert(p.parse({})).equals({});
  assert(p.parse({ foo: "foo" })).equals({ foo: "foo" });
  assert(p.parse({ bar: 1 })).equals({ bar: 1 });
  assert(p.parse({ bar: 1, foo: "foo" })).equals({ bar: 1, foo: "foo" });
  assert(p).invalid_type([{ bar: "foo", foo: 1 }], "/bar");
  assert(p).type<PartialType<{ foo: StringType; bar: NumberType }>>();
});

test.case("coerce", assert => {
  type Expected = {
    name: string;
    scores: number[];
    tupled: [string, boolean];
  };
  type ExpectSchema = ObjectType<{
    name: StringType;
    scores: ArrayType<NumberType>;
    tupled: TupleType<[StringType, BooleanType]>;
  }>;

  const s = schema({
    name: string,
    scores: array(number),
    tupled: tuple(string, boolean),
  });

  const si = schema({
    name: string,
    scores: [number],
    tupled: [string, boolean],
  });

  const valid = { name: "John", scores: ["1", "2"], tupled: ["yes", "true"] };
  const parsed = { name: "John", scores: [1, 2], tupled: ["yes", true] };
  const invalid = { name: "Bob", scores: ["oops"], tupled: ["ok", "nope"] };

  for (const type of [s, si]) {
    assert(type).type<ExpectSchema>();
    assert(type.coerce(valid)).equals(parsed).type<Expected>;
    assert(type).invalid_type([invalid], "/scores/0");
  }
});

test.case("deep shorthand coerce", assert => {
  const s = schema({
    user: {
      age: number,
      flags: [boolean],
    },
    pair: [string, boolean],
  });

  type Expected = {
    user: {
      age: number;
      flags: boolean[];
    };
    pair: [string, boolean];
  };

  assert(s.coerce({
    user: {
      age: "42",
      flags: ["true", "false"],
    },
    pair: ["ok", "true"],
  })).equals({
    user: {
      age: 42,
      flags: [true, false],
    },
    pair: ["ok", true],
  }).type<Expected>();
});
