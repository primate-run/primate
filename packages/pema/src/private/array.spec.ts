import array from "#array";
import type ArrayType from "#ArrayType";
import bigint from "#bigint";
import type BigIntType from "#BigIntType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import date from "#date";
import type DateType from "#DateType";
import number from "#number";
import type NumberType from "#NumberType";
import { Code } from "#schema-errors";
import string from "#string";
import type StringType from "#StringType";
import test from "#test";
import tuple from "#tuple";

const b = array(boolean);
const bi = array(bigint);
const d = array(date);
const n = array(number);
const s = array(string);

const ab = [false];
const abi = [0n];
const _d = new Date();
const ad = [_d];
const an = [0];
const as = ["0"];

const x = <T>(t: T, length = 2) => Array.from({ length }, _ => t).flat();

test.case("empty", assert => {
  assert(b).type<ArrayType<BooleanType>>();
  assert(b.parse([])).equals([]).type<boolean[]>();

  assert(bi).type<ArrayType<BigIntType>>();
  assert(bi.parse([])).equals([]).type<bigint[]>();

  assert(d).type<ArrayType<DateType>>();
  assert(d.parse([])).equals([]).type<Date[]>();

  assert(n).type<ArrayType<NumberType>>();
  assert(n.parse([])).equals([]).type<number[]>();

  assert(s).type<ArrayType<StringType>>();
  assert(s.parse([])).equals([]).type<string[]>();
});

test.case("flat", assert => {
  assert(b.parse(ab)).equals(ab).type<boolean[]>();
  assert(bi.parse(abi)).equals(abi).type<bigint[]>();
  assert(d.parse(ad)).equals(ad).type<Date[]>();
  assert(n.parse(an)).equals(an).type<number[]>();
  assert(s.parse(as)).equals(as).type<string[]>();

  assert(b.parse(x(ab, 3))).equals(x(ab, 3));
  assert(bi.parse(x(abi, 4))).equals(x(abi, 4));
  assert(d.parse(x(ad, 5))).equals(x(ad, 5));
  assert(n.parse(x(an, 6))).equals(x(an, 6));
  assert(s.parse(x(as))).equals(x(as));

  assert(b).invalid_type([abi], "/0");
  assert(bi).invalid_type([ad], "/0");
  assert(d).invalid_type([an], "/0");
  assert(n).invalid_type([as], "/0");
  assert(s).invalid_type([ab], "/0");

  assert(b).invalid_type([[...ab, ...ad]], "/1");
  assert(bi).invalid_type([[...abi, ...ad]], "/1");
  assert(d).invalid_type([[...ab, ...ad]], "/0");
  assert(n).invalid_type([[...as, ...an]], "/0");
  assert(s).invalid_type([[...as, ...an]], "/1");
});

test.case("coerce", assert => {
  assert(n).type<ArrayType<NumberType>>();
  assert(b).type<ArrayType<BooleanType>>();
  assert(bi).type<ArrayType<BigIntType>>();
  assert(d).type<ArrayType<DateType>>();

  assert(n.coerce(["1", "2"])).equals([1, 2]).type<number[]>();
  assert(b.coerce(["true", "false"])).equals([true, false]).type<boolean[]>();
  assert(bi.coerce(["1", "2"])).equals([1n, 2n]).type<bigint[]>();

  const d0 = "2024-01-01T00:00:00.000Z";
  const d1 = "2024-01-02T00:00:00.000Z";
  assert(d.coerce([d0, d1]))
    .equals([new Date(d0), new Date(d1)]).type<Date[]>();

  for (const type of [n, b, bi, d]) {
    assert(type).coerce_invalid_type([["foo"]], "/0");
  }
});

test.case("sparse", assert => {
  assert(s).invalid_type([["f", undefined, "f"]], "/1");
  assert(s).invalid_type([["f", , "f"]], "/1");
  assert(s).invalid_type([[, "f"]], "/0");
  // current implementation points at the trailing hole index
  assert(s).invalid_type([["f", "f", ,]], "/2");
});

test.case("default", assert => {
  const sd = array(string).default(["a", "b"]);
  assert(sd.parse(undefined)).equals(["a", "b"]).type<string[]>();
  assert(sd.parse(["x"])).equals(["x"]).type<string[]>();
  const nd = array(number).default([1, 2]);
  assert(nd).invalid_type([["nope"]], "/0");
});

test.case("deep", assert => {
  const rc = array(s);
  assert(rc.parse([as])).equals([as]).type<string[][]>();

  assert(rc).invalid_type([["0"]], "/0");
  assert(rc).invalid_type([[[0]]], "/0/0");
});

test.case("deep coerce", assert => {
  const rc = array(array(number));
  assert(rc.coerce([["1"], ["2", "3"]]))
    .equals([[1], [2, 3]])
    .type<number[][]>();
  assert(rc).coerce_invalid_type([[["oops"]]], "/0/0");

  const tc = array(tuple(string, number, boolean));
  assert(tc.coerce([["foo", "1", "true"], ["bar", "2", "false"]]))
    .equals([["foo", 1, true], ["bar", 2, false]])
    .type<[string, number, boolean][]>();

  assert(tc).coerce_invalid_type([[["foo", "nope", "true"]]], "/0/1");
  assert(tc).coerce_invalid_type([[["foo", "1", "nope"]]], "/0/2");
});

test.case("validator: unique", assert => {
  const unique_s = s.unique();
  const unique_n = n.unique();

  assert(() => (d as any).unique()).throws(Code.unique_subtype_not_primitive);

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
  const o = array(tuple(string, number)).uniqueBy(([name]) => name);

  assert(o.parse([["a", 1], ["b", 2]]))
    .equals([["a", 1], ["b", 2]])
    .type<[string, number][]>();

  assert(o).duplicate([[["a", 1], ["a", 2]]], "/1");

});

test.case("validator: min", assert => {
  assert(() => s.min(-10)).throws(Code.min_negative);
  assert(() => s.min(Infinity)).throws(Code.min_limit_not_finite);
  assert(() => s.min(NaN)).throws(Code.min_limit_not_finite);
  const min = s.min(3);
  assert(min.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(min).too_small([["a", "b"]]);
});

test.case("validator: max", assert => {
  assert(() => s.max(-10)).throws(Code.max_negative);
  assert(() => s.max(Infinity)).throws(Code.max_limit_not_finite);
  assert(() => s.max(NaN)).throws(Code.max_limit_not_finite);
  const max = s.max(3);
  assert(max.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(max).too_large([["a", "b", "c", "d"]]);
});

test.case("validator: length", assert => {
  assert(() => s.length(Infinity, 10)).throws(Code.length_not_finite);
  assert(() => s.length(-10, 10)).throws(Code.length_not_positive);
  assert(() => s.length(10, -10)).throws(Code.length_not_positive);
  assert(() => s.length(5, 3)).throws(Code.length_from_exceeds_to);
  const length = s.length(0, 2);
  assert(length.parse(["a", "b"])).equals(["a", "b"]).type<string[]>();
  assert(length.parse(["a"])).equals(["a"]).type<string[]>();
  assert(length.parse([])).equals([]).type<string[]>();
  assert(length).out_of_range([["a", "b", "c"]]);
});

test.case("object", assert => {
  //const rc = array({ foo: string });
});
