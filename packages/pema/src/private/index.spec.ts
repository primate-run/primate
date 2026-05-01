import type ArrayType from "#ArrayType";
import type BooleanType from "#BooleanType";
import p from "#index";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type NumberType from "#NumberType";
import type ObjectType from "#ObjectType";
import type PartialType from "#PartialType";
import type StringType from "#StringType";
import test from "#test";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type { EmptyDict } from "@rcompat/type";

const types = [
  [p.bigint, 0n, 0],
  [p.blob, new Blob(), 0],
  [p.boolean, false, "0"],
  [p.date, new Date(), "0"],
  [p.number, 0, "0"],
  [p.string, "0", 0],
  [p.symbol, Symbol(), 0],
  [p.file, new File([""], ""), 0],
] as const;

test.case("primitive validators", assert => {
  types.forEach(([parsed, good, bad]) => {
    const s = p(parsed);
    assert(s.parse(good)).equals(good);
    assert(s).invalid_type([bad]);
  });
});

test.case("literals", assert => {
  const foo = p("foo");
  assert(foo).type<LiteralType<"foo">>();
  assert(foo.parse("foo")).equals("foo").type<"foo">();
  const t = p(true);
  assert(t).type<LiteralType<true>>();
  assert(t.parse(true)).equals(true).type<true>();
  assert(t).invalid_type([false]);
  const f = p(false);
  assert(f).type<LiteralType<false>>();
  assert(f.parse(false)).equals(false).type<false>();
  assert(f).invalid_type([true]);
});

test.case("empty []", assert => {
  const s = p([]);
  assert(s).type<TupleType<[]>>();
  assert(s.parse([])).equals([]).type<[]>();
});

test.case("empty {}", assert => {
  const s = p({});
  assert(s).type<ObjectType<EmptyDict>>();
  assert(s.parse({})).equals({}).type<EmptyDict>();
});

test.case("object", assert => {
  const o = { foo: "bar" };
  type O = { foo: string };
  const o1 = { bar: { baz: 0 }, foo: "bar" };
  type O1 = { bar: { baz: number }; foo: string };

  const s = p({ foo: p.string });
  const s1 = p({ bar: { baz: p.number }, foo: p.string });

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

  const s = p(p.array(p.string));
  const si = p([p.string]);

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

  const s = p(p.tuple(p.string, p.number));
  const si = p([p.string, p.number]);
  const snb = p([p.string, p.number, p.boolean]);

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
  const complex = p({
    name: p.string,
    scores: p.array(p.number),
    tupled: p.tuple(p.string, p.boolean),
  });
  const complexi = p({
    name: p.string,
    scores: [p.number],
    tupled: [p.string, p.boolean],
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
  assert(p(null)).type<NullType>();
  assert(p(null).parse(null)).equals(null).type<null>();
  assert(p(null)).invalid_type(["null"]);
  assert(p(undefined)).type<UndefinedType>();
  assert(p(undefined).parse(undefined)).equals(undefined).type<undefined>();
  assert(p(undefined)).invalid_type([null]);
});

test.case("partial", assert => {
  const partial = p.partial({ bar: p.number, foo: p.string });
  assert(partial.parse({})).equals({});
  assert(partial.parse({ foo: "foo" })).equals({ foo: "foo" });
  assert(partial.parse({ bar: 1 })).equals({ bar: 1 });
  assert(partial.parse({ bar: 1, foo: "foo" })).equals({ bar: 1, foo: "foo" });
  assert(partial).invalid_type([{ bar: "foo", foo: 1 }], "/bar");
  assert(partial).type<PartialType<{ foo: StringType; bar: NumberType }>>();
});

test.case("loose", assert => {
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

  const s = p({
    name: p.string,
    scores: p.array(p.number),
    tupled: p.tuple(p.string, p.boolean),
  });

  const si = p({
    name: p.string,
    scores: [p.number],
    tupled: [p.string, p.boolean],
  });

  const valid = { name: "John", scores: ["1", "2"], tupled: ["yes", "true"] };
  const parsed = { name: "John", scores: [1, 2], tupled: ["yes", true] };
  const invalid = { name: "Bob", scores: ["oops"], tupled: ["ok", "nope"] };

  for (const type of [s, si]) {
    assert(type.parse(parsed)).equals(parsed).type<Expected>;
    assert(type).type<ExpectSchema>();
    assert(type).invalid_type([invalid], "/scores/0");
  }

  const sl = p.loose({
    name: p.string,
    scores: p.array(p.number),
    tupled: p.tuple(p.string, p.boolean),
  });

  const sil = p.loose({
    name: p.string,
    scores: [p.number],
    tupled: [p.string, p.boolean],
  });

  for (const type of [sl, sil]) {
    assert(type.parse(valid)).equals(parsed).type<Expected>;
    assert(type).type<ExpectSchema>();
    assert(type).invalid_type([invalid], "/scores/0");
  }
});

test.case("deep shorthand loose", assert => {
  const s = p.loose({
    user: {
      age: p.number,
      flags: [p.boolean],
    },
    pair: [p.string, p.boolean],
  });

  type Expected = {
    user: {
      age: number;
      flags: boolean[];
    };
    pair: [string, boolean];
  };

  assert(s.parse({
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

test.case("loose with strict escape hatch", assert => {
  const s = p.loose({
    name: p.string,
    age: p.number,
    age_int: p.u8,
    big: p.bigint,
    active: p.boolean,
    created: p.date,
    strict_name: p.strict.string,
    strict_age: p.strict.number,
    strict_age_int: p.strict.u8,
    strict_big: p.strict.bigint,
    strict_active: p.strict.boolean,
  });

  // loose fields coerce
  assert(s.parse({
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: "John",
    strict_age: 42,
    strict_age_int: 30,
    strict_big: 1n,
    strict_active: true,
  })).equals({
    name: "Bob",
    age: 42,
    age_int: 30,
    big: 1n,
    active: true,
    created: new Date("2024-01-01T00:00:00.000Z"),
    strict_name: "John",
    strict_age: 42,
    strict_age_int: 30,
    strict_big: 1n,
    strict_active: true,
  });

  assert(s).invalid_type([{
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: 42,
    strict_age: 42,
    strict_age_int: 30,
    strict_big: 1n,
    strict_active: true,
  }], "/strict_name");
  assert(s).invalid_type([{
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: "John",
    strict_age: "42",
    strict_age_int: 30,
    strict_big: 1n,
    strict_active: true,
  }], "/strict_age");

  assert(s).invalid_type([{
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: "John",
    strict_age: 42,
    strict_age_int: "30",
    strict_big: 1n,
    strict_active: true,
  }], "/strict_age_int");

  assert(s).invalid_type([{
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: "John",
    strict_age: 42,
    strict_age_int: 30,
    strict_big: "1",
    strict_active: true,
  }], "/strict_big");

  assert(s).invalid_type([{
    name: "Bob",
    age: "42",
    age_int: "30",
    big: "1",
    active: "true",
    created: "2024-01-01T00:00:00.000Z",
    strict_name: "John",
    strict_age: 42,
    strict_age_int: 30,
    strict_big: 1n,
    strict_active: "true",
  }], "/strict_active");
});
