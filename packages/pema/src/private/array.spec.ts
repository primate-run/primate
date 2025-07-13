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
  assert(b.validate([])).equals([]).type<boolean[]>();

  assert(bi).type<ArrayType<BigIntType>>();
  assert(bi.validate([])).equals([]).type<bigint[]>();

  assert(d).type<ArrayType<DateType>>();
  assert(d.validate([])).equals([]).type<Date[]>();

  assert(n).type<ArrayType<NumberType>>();
  assert(n.validate([])).equals([]).type<number[]>();

  assert(s).type<ArrayType<StringType>>();
  assert(s.validate([])).equals([]).type<string[]>();
});

test.case("flat", assert => {
  assert(b.validate(ab)).equals(ab).type<boolean[]>();
  assert(bi.validate(abi)).equals(abi).type<bigint[]>();
  assert(d.validate(ad)).equals(ad).type<Date[]>();
  assert(n.validate(an)).equals(an).type<number[]>();
  assert(s.validate(as)).equals(as).type<string[]>();

  assert(b.validate(x(ab, 3))).equals(x(ab, 3));
  assert(bi.validate(x(abi, 4))).equals(x(abi, 4));
  assert(d.validate(x(ad, 5))).equals(x(ad, 5));
  assert(n.validate(x(an, 6))).equals(x(an, 6));
  assert(s.validate(x(as))).equals(x(as));

  assert(() => b.validate(abi)).throws(expect("b", 0n, "[0]"));
  assert(() => bi.validate(ad)).throws(expect("bi", _d, "[0]"));
  assert(() => d.validate(an)).throws(expect("d", 0, "[0]"));
  assert(() => n.validate(as)).throws(expect("n", "0", "[0]"));
  assert(() => s.validate(ab)).throws(expect("s", false, "[0]"));

  assert(() => b.validate([...ab, ...ad])).throws(expect("b", _d, "[1]"));
  assert(() => bi.validate([...abi, ...ad])).throws(expect("bi", _d, "[1]"));
  assert(() => d.validate([...ab, ...ad])).throws(expect("d", false, "[0]"));
  assert(() => n.validate([...as, ...an])).throws(expect("n", "0", "[0]"));
  assert(() => s.validate([...as, ...an])).throws(expect("s", 0, "[1]"));
});

test.case("sparse", assert => {
  const b0 = ["f", undefined, "f"];
  const b1 = ["f", , "f"];
  const b2 = [, "f"];
  const b3 = ["f", "f", ,];

  assert(() => s.validate(b0)).throws(expect("s", undefined, "[1]"));
  assert(() => s.validate(b1)).throws(expect("s", undefined, "[1]"));
  assert(() => s.validate(b2)).throws(expect("s", undefined, "[0]"));
  assert(() => s.validate(b3)).throws(expect("s", undefined, "[2]"));
});

test.case("deep", assert => {
  const rc = array(array(string));
  assert(rc.validate([as])).equals([as]).type<string[][]>();

  assert(() => rc.validate(as)).throws(expect("a", "0", "[0]"));
  assert(() => rc.validate([[0]])).throws();
});

test.case("object", assert => {
  //const rc = array({ foo: string });
});
