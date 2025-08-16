import array from "#array";
import type ArrayType from "#ArrayType";
import bigint from "#bigint";
import type BigIntType from "#BigIntType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import date from "#date";
import type DateType from "#DateType";
import expect from "#expect";
import number from "#number";
import type NumberType from "#NumberType";
import string from "#string";
import type StringType from "#StringType";
import test from "@rcompat/test";

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

  assert(() => b.parse(abi)).throws(expect("b", 0n, 0));
  assert(() => bi.parse(ad)).throws(expect("bi", _d, 0));
  assert(() => d.parse(an)).throws(expect("d", 0, 0));
  assert(() => n.parse(as)).throws(expect("n", "0", 0));
  assert(() => s.parse(ab)).throws(expect("s", false, 0));

  assert(() => b.parse([...ab, ...ad])).throws(expect("b", _d, 1));
  assert(() => bi.parse([...abi, ...ad])).throws(expect("bi", _d, 1));
  assert(() => d.parse([...ab, ...ad])).throws(expect("d", false, 0));
  assert(() => n.parse([...as, ...an])).throws(expect("n", "0", 0));
  assert(() => s.parse([...as, ...an])).throws(expect("s", 0, 1));
});

test.case("sparse", assert => {
  const b0 = ["f", undefined, "f"];
  const b1 = ["f", , "f"];
  const b2 = [, "f"];
  const b3 = ["f", "f", ,];

  assert(() => s.parse(b0)).throws(expect("s", undefined, 1));
  assert(() => s.parse(b1)).throws(expect("s", undefined, 1));
  assert(() => s.parse(b2)).throws(expect("s", undefined, 0));
  assert(() => s.parse(b3)).throws(expect("s", undefined, 2));
});

test.case("deep", assert => {
  const rc = array(array(string));
  assert(rc.parse([as])).equals([as]).type<string[][]>();

  assert(() => rc.parse(as)).throws(expect("a", "0", 0));
  assert(() => rc.parse([[0]])).throws();
});

test.case("object", assert => {
  //const rc = array({ foo: string });
});
