import array from "#array";
import type ArrayType from "#ArrayType";
import bigint from "#bigint";
import blob from "#blob";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import type CoercedType from "#CoercedType";
import date from "#date";
import expect from "#expect";
import file from "#file";
import schema from "#index";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import number from "#number";
import type NumberType from "#NumberType";
import type SchemaType from "#SchemaType";
import string from "#string";
import type StringType from "#StringType";
import symbol from "#symbol";
import tuple from "#tuple";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import test from "@rcompat/test";
import type EO from "@rcompat/type/EO";

const types = [
  [bigint, 0n, 0, "bi"],
  [blob, new Blob(), 0, "bb"],
  [boolean, false, "0", "b"],
  [date, new Date(), "0", "d"],
  [number, 0, "0", "n"],
  [string, "0", 0, "s"],
  [symbol, Symbol(), 0, "sy"],
  [file, new File([""], ""), 0, "f"],
] as const;

test.case("primitive validators", assert => {
  types.forEach(([parsed, good, bad, type]) => {
    const s = schema(parsed);
    assert(s.parse(good)).equals(good);
    assert(() => s.parse(bad)).throws(expect(type, bad));
  });
});

test.case("literals", assert => {
  const foo = schema("foo");
  assert(foo).type<SchemaType<LiteralType<"foo">>>();
  assert(foo.parse("foo")).equals("foo").type<"foo">();
});

test.case("empty []", assert => {
  const s = schema([]);
  assert(s).type<SchemaType<TupleType<[]>>>();
  assert(s.parse([])).equals([]).type<[]>();
});

test.case("empty {}", assert => {
  const s = schema({});
  assert(s).type<SchemaType<EO>>();
  assert(s.parse({})).equals({}).type<EO>();
});

test.case("object", assert => {
  const o = { foo: "bar" };
  type O = { foo: string };
  const o1 = { bar: { baz: 0 }, foo: "bar" };
  type O1 = { bar: { baz: number }; foo: string };

  const s = schema({ foo: string });
  const s1 = schema({ bar: { baz: number }, foo: string });

  assert<typeof s>().type<SchemaType<{ foo: StringType }>>();
  assert(s.parse(o)).equals(o).type<O>();

  assert(s1).type<SchemaType<{ bar: { baz: NumberType }; foo: StringType }>>();
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

  assert(s).type<SchemaType<ArrayType<StringType>>>();
  assert(s.parse(g0)).equals(g0).type<string[]>();
  assert(s.parse(g1)).equals(g1).type<string[]>();
  assert(s.parse(g2)).equals(g2).type<string[]>();

  assert(si).type<SchemaType<ArrayType<StringType>>>();
  assert(si.parse(g0)).equals(g0).type<string[]>();
  assert(si.parse(g1)).equals(g1).type<string[]>();
  assert(si.parse(g2)).equals(g2).type<string[]>();

  assert(() => s.parse(b0)).throws(expect("s", false, 0));
  assert(() => s.parse(b1)).throws(expect("s", 0, 1));
  assert(() => si.parse(b0)).throws(expect("s", false, 0));
  assert(() => si.parse(b1)).throws(expect("s", 0, 1));
  assert(() => s.parse(1)).throws(expect("a", 1));
  assert(() => si.parse(1)).throws(expect("a", 1));
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

  assert(s).type<SchemaType<TupleType<[StringType, NumberType]>>>();
  assert(s.parse(g0)).equals(g0).type<[string, number]>();

  assert(si).type<SchemaType<TupleType<[StringType, NumberType]>>>();
  assert(si.parse(g0)).equals(g0).type<[string, number]>();

  assert(snb)
    .type<SchemaType<TupleType<[StringType, NumberType, BooleanType]>>>();

  assert(() => s.parse(b0)).throws(expect("s", undefined, 0));
  assert(() => s.parse(b1)).throws(expect("n", undefined, 1));
  assert(() => s.parse(b2)).throws(expect("s", 0, 0));
  assert(() => s.parse(b3)).throws(expect("s", 0, 0));

  assert(() => si.parse(b0)).throws(expect("s", undefined, 0));
  assert(() => si.parse(b1)).throws(expect("n", undefined, 1));
  assert(() => si.parse(b2)).throws(expect("s", 0, 0));
  assert(() => si.parse(b3)).throws(expect("s", 0, 0));
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

  const valid = { name: "Alice", scores: [1, 2, 3], tupled: ["yes", true] };
  const invalid = { name: "Bob", scores: ["oops"], tupled: ["ok", "nope"] };

  type Expected = {
    name: string;
    scores: number[];
    tupled: [string, boolean];
  };
  type ExpectSchema = SchemaType<{
    name: StringType;
    scores: ArrayType<NumberType>;
    tupled: TupleType<[StringType, BooleanType]>;
  }>;

  assert(complex).type<ExpectSchema>();
  assert(complex.parse(valid)).equals(valid).type<Expected>;
  assert(() => complex.parse(invalid))
    .throws(expect("n", "oops", "scores.0"));

  assert(complexi).type<ExpectSchema>();
  assert(complexi.parse(valid)).equals(valid).type<Expected>();
  assert(() => complexi.parse(invalid))
    .throws(expect("n", "oops", "scores.0"));
});

test.case("null/undefined", assert => {
  assert(schema(null)).type<SchemaType<NullType>>();
  assert(schema(null).parse(null)).equals(null).type<null>();
  assert(() => schema(null).parse("null")).throws(expect("nl", "null"));

  assert(schema(undefined)).type<SchemaType<UndefinedType>>();
  assert(schema(undefined).parse(undefined)).equals(undefined)
    .type<undefined>();
  assert(() => schema(undefined).parse(null)).throws(expect("u", null));
});

test.case("coerce", assert => {
  type Expected = {
    name: string;
    scores: number[];
    tupled: [string, boolean];
  };
  type ExpectSchema = CoercedType<SchemaType<{
    name: StringType;
    scores: ArrayType<NumberType>;
    tupled: TupleType<[StringType, BooleanType]>;
  }>>;

  const coerced = schema({
    name: string,
    scores: array(number),
    tupled: tuple(string, boolean),
  }).coerce;

  const coercedi = schema({
    name: string,
    scores: [number],
    tupled: [string, boolean],
  }).coerce;

  const valid = { name: "Alice", scores: ["1", "2"], tupled: ["yes", "true"] };
  const invalid = { name: "Bob", scores: ["oops"], tupled: ["ok", "nope"] };

  assert(coerced).type<ExpectSchema>();
  assert(coerced.parse(valid)).equals(valid).type<Expected>;

  assert(coercedi).type<ExpectSchema>();
  assert(coercedi.parse(valid)).equals(valid).type<Expected>();
  assert(() => coerced.parse(invalid))
    .throws(expect("n", "oops", "scores.0"));
});
