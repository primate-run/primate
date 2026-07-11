import type ArrayType from "#ArrayType";
import type BigIntType from "#BigIntType";
import type BooleanType from "#BooleanType";
import type DateType from "#DateType";
import p from "#index";
import type NumberType from "#NumberType";
import { Code } from "#schema-errors";
import type StringType from "#StringType";
import test from "#test";

const boolean = p.array(p.boolean);
const bigint = p.array(p.bigint);
const date = p.array(p.date);
const number = p.array(p.number);
const string = p.array(p.string);

const ab = [false];
const abi = [0n];
const _d = new Date();
const ad = [_d];
const an = [0];
const as = ["0"];

const x = <T>(t: T, length = 2) => Array.from({ length }, _ => t).flat();

test.case("empty", assert => {
  assert(boolean).type<ArrayType<BooleanType>>();
  assert(boolean.parse([])).equals([]).type<boolean[]>();

  assert(bigint).type<ArrayType<BigIntType>>();
  assert(bigint.parse([])).equals([]).type<bigint[]>();

  assert(date).type<ArrayType<DateType>>();
  assert(date.parse([])).equals([]).type<Date[]>();

  assert(number).type<ArrayType<NumberType>>();
  assert(number.parse([])).equals([]).type<number[]>();

  assert(string).type<ArrayType<StringType>>();
  assert(string.parse([])).equals([]).type<string[]>();
});

test.case("flat", assert => {
  assert(boolean.parse(ab)).equals(ab).type<boolean[]>();
  assert(bigint.parse(abi)).equals(abi).type<bigint[]>();
  assert(date.parse(ad)).equals(ad).type<Date[]>();
  assert(number.parse(an)).equals(an).type<number[]>();
  assert(string.parse(as)).equals(as).type<string[]>();

  assert(boolean.parse(x(ab, 3))).equals(x(ab, 3));
  assert(bigint.parse(x(abi, 4))).equals(x(abi, 4));
  assert(date.parse(x(ad, 5))).equals(x(ad, 5));
  assert(number.parse(x(an, 6))).equals(x(an, 6));
  assert(string.parse(x(as))).equals(x(as));

  assert(boolean).invalid_type([abi], "/0");
  assert(bigint).invalid_type([ad], "/0");
  assert(date).invalid_type([an], "/0");
  assert(number).invalid_type([as], "/0");
  assert(string).invalid_type([ab], "/0");

  assert(boolean).invalid_type([[...ab, ...ad]], "/1");
  assert(bigint).invalid_type([[...abi, ...ad]], "/1");
  assert(date).invalid_type([[...ab, ...ad]], "/0");
  assert(number).invalid_type([[...as, ...an]], "/0");
  assert(string).invalid_type([[...as, ...an]], "/1");
});

test.case("derive", assert => {
  const count = p.array(p.string).derive(value => value.length);

  assert(count.parse(["a", "b", "c"])).equals(3).type<number>();
});

test.case("loose", assert => {
  const loose_boolean = p.loose.array(p.boolean);
  const loose_bigint = p.loose.array(p.bigint);
  const loose_date = p.loose.array(p.date);
  const loose_number = p.loose.array(p.number);

  assert(loose_number).type<ArrayType<NumberType, true>>();
  assert(loose_boolean).type<ArrayType<BooleanType, true>>();
  assert(loose_bigint).type<ArrayType<BigIntType, true>>();
  assert(loose_date).type<ArrayType<DateType, true>>();

  assert(loose_number.parse(["1", "2"])).equals([1, 2]).type<number[]>();
  assert(loose_boolean.parse(["true", "false"]))
    .equals([true, false]).type<boolean[]>();
  assert(loose_bigint.parse(["1", "2"])).equals([1n, 2n]).type<bigint[]>();

  const d0 = "2024-01-01T00:00:00.000Z";
  const d1 = "2024-01-02T00:00:00.000Z";
  assert(loose_date.parse([d0, d1]))
    .equals([new Date(d0), new Date(d1)]).type<Date[]>();

  for (const type of [loose_number, loose_boolean, loose_bigint, loose_date]) {
    assert(type).invalid_type([["foo"]], "/0");
  }
});

test.case("sparse", assert => {
  assert(string).invalid_type([["f", undefined, "f"]], "/1");
  assert(string).invalid_type([["f", , "f"]], "/1");
  assert(string).invalid_type([[, "f"]], "/0");
  // current implementation points at the trailing hole index
  assert(string).invalid_type([["f", "f", ,]], "/2");
});

test.case("default", assert => {
  const sd = p.array(p.string).default(["a", "b"]);
  assert(sd.parse(undefined)).equals(["a", "b"]).type<string[]>();
  assert(sd.parse(["x"])).equals(["x"]).type<string[]>();
  const nd = p.array(p.number).default([1, 2]);
  assert(nd).invalid_type([["nope"]], "/0");
});

test.case("deep", assert => {
  const rc = p.array(string);
  assert(rc.parse([as])).equals([as]).type<string[][]>();

  assert(rc).invalid_type([["0"]], "/0");
  assert(rc).invalid_type([[[0]]], "/0/0");
});

test.case("deep loose", assert => {
  const rc = p.loose.array(p.array(p.number));
  assert(rc.parse([["1"], ["2", "3"]]))
    .equals([[1], [2, 3]])
    .type<number[][]>();
  assert(rc).invalid_type([[["oops"]]], "/0/0");

  const tc = p.loose.array(p.tuple(p.string, p.number, p.boolean));
  assert(tc.parse([["foo", "1", "true"], ["bar", "2", "false"]]))
    .equals([["foo", 1, true], ["bar", 2, false]])
    .type<[string, number, boolean][]>();

  assert(tc).invalid_type([[["foo", "nope", "true"]]], "/0/1");
  assert(tc).invalid_type([[["foo", "1", "nope"]]], "/0/2");
});

test.case("validator: unique", assert => {
  const unique_s = string.unique();
  const unique_n = number.unique();

  assert(() => (date as any).unique()).throws(Code.unique_subtype_not_primitive);

  assert(unique_s).type<ArrayType<StringType>>();
  assert(unique_n).type<ArrayType<NumberType>>();

  assert(unique_s.parse(["a", "b"])).type<string[]>().equals(["a", "b"]);
  assert(unique_s.parse(["b", "a"])).type<string[]>().equals(["b", "a"]);
  assert(unique_n.parse([1, 2])).type<number[]>().equals([1, 2]);
  assert(unique_n.parse([2, 1])).type<number[]>().equals([2, 1]);

  assert(unique_s).duplicate([["a", "b", "a"]], "/2");
  assert(unique_n).duplicate([[1, 2, 1]], "/2");
});

test.case("validator: uniqueBy", assert => {
  const o = p.array(p.tuple(p.string, p.number)).uniqueBy(([name]) => name);

  assert(o.parse([["a", 1], ["b", 2]]))
    .equals([["a", 1], ["b", 2]])
    .type<[string, number][]>();

  assert(o).duplicate([[["a", 1], ["a", 2]]], "/1");

});

test.case("validator: min", assert => {
  assert(() => string.min(-10)).throws(Code.min_negative);
  assert(() => string.min(Infinity)).throws(Code.min_limit_not_finite);
  assert(() => string.min(NaN)).throws(Code.min_limit_not_finite);
  const min = string.min(3);
  assert(min.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(min).too_small([["a", "b"]]);
});

test.case("validator: max", assert => {
  assert(() => string.max(-10)).throws(Code.max_negative);
  assert(() => string.max(Infinity)).throws(Code.max_limit_not_finite);
  assert(() => string.max(NaN)).throws(Code.max_limit_not_finite);
  const max = string.max(3);
  assert(max.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(max).too_large([["a", "b", "c", "d"]]);
});

test.case("validator: length", assert => {
  assert(() => string.length(Infinity, 10)).throws(Code.length_not_finite);
  assert(() => string.length(-10, 10)).throws(Code.length_not_positive);
  assert(() => string.length(10, -10)).throws(Code.length_not_positive);
  assert(() => string.length(5, 3)).throws(Code.length_from_exceeds_to);
  const length = string.length(0, 2);
  assert(length.parse(["a", "b"])).equals(["a", "b"]).type<string[]>();
  assert(length.parse(["a"])).equals(["a"]).type<string[]>();
  assert(length.parse([])).equals([]).type<string[]>();
  assert(length).out_of_range([["a", "b", "c"]]);
});

test.case("object", assert => {
  //const rc = p.array({ foo: string });
});
