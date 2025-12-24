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
import messagesOf from "#test/messages-of";
import pathsOf from "#test/paths-of";
import throwsIssues from "#test/throws-issues";
import color from "@rcompat/cli/color";
import test from "@rcompat/test";

const { dim } = color;

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

  {
    const issues = throwsIssues(assert, () => s.parse(b0));
    assert(pathsOf(issues)).equals(["/1"]);
    assert(messagesOf(issues)).equals([expect("s", undefined)]);
  }
  {
    const issues = throwsIssues(assert, () => s.parse(b1));
    assert(pathsOf(issues)).equals(["/1"]);
    assert(messagesOf(issues)).equals([expect("s", undefined)]);
  }
  {
    const issues = throwsIssues(assert, () => s.parse(b2));
    assert(pathsOf(issues)).equals(["/0"]);
    assert(messagesOf(issues)).equals([expect("s", undefined)]);
  }
  {
    const issues = throwsIssues(assert, () => s.parse(b3));
    // current implementation points at the trailing hole index
    assert(pathsOf(issues)).equals(["/2"]);
    assert(messagesOf(issues)).equals([expect("s", undefined)]);
  }
});

test.case("default", assert => {
  const sd = array(string).default(["a", "b"]);
  assert(sd.parse(undefined)).equals(["a", "b"]).type<string[]>();
  assert(sd.parse(["x"])).equals(["x"]).type<string[]>();
  const nd = array(number).default([1, 2]);
  assert(() => nd.parse(["nope"])).throws();
});

test.case("deep", assert => {
  const rc = array(s);
  assert(rc.parse([as])).equals([as]).type<string[][]>();

  assert(() => rc.parse(as)).throws(expect("a", "0", 0));
  assert(() => rc.parse([[0]])).throws();
});

test.case("validator - unique", assert => {
  const unique_s = s.unique();
  const unique_n = n.unique();

  // @ts-expect-error non-primitive subtype
  assert(() => d.unique().parse())
    .throws(`unique: subtype ${color.dim("date")} must be primitive`);

  assert(unique_s).type<ArrayType<StringType>>();
  assert(unique_n).type<ArrayType<NumberType>>();

  assert(unique_s.parse(["a", "b"])).type<string[]>().equals(["a", "b"]);
  assert(unique_s.parse(["b", "a"])).type<string[]>().equals(["b", "a"]);
  assert(unique_n.parse([1, 2])).type<number[]>().equals([1, 2]);
  assert(unique_n.parse([2, 1])).type<number[]>().equals([2, 1]);

  const error = "duplicate value at index 2 (first seen at 0)";
  {
    const issues = throwsIssues(assert, () => unique_s.parse(["a", "b", "a"]));
    assert(pathsOf(issues)).equals(["/2"]);
    assert(messagesOf(issues)).equals([error]);
  }
  {
    const issues = throwsIssues(assert, () => unique_n.parse([1, 2, 1]));
    assert(pathsOf(issues)).equals(["/2"]);
    assert(messagesOf(issues)).equals([error]);
  }
});

test.case("validator - min", assert => {
  assert(() => s.min(-10)).throws(`min: ${dim("-10")} must be positive`);
  const min = s.min(3);
  assert(min.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(() => min.parse(["a", "b"])).throws("min 3 items");
});

test.case("validator - max", assert => {
  assert(() => s.max(-10)).throws(`max: ${dim("-10")} must be positive`);
  const max = s.max(3);
  assert(max.parse(["a", "b", "c"])).equals(["a", "b", "c"]).type<string[]>();
  assert(() => max.parse(["a", "b", "c", "d"])).throws("max 3 items");
});

test.case("validator - length", assert => {
  assert(() => s.length(-10, 10))
    .throws(`length: ${dim("-10")} and ${dim("10")} must be positive`);
  assert(() => s.length(10, -10))
    .throws(`length: ${dim("10")} and ${dim("-10")} must be positive`);
  assert(() => s.length(5, 3))
    .throws(`length: ${dim("5")} must be lower than ${dim("3")}`);
  const length = s.length(0, 2);
  assert(length.parse(["a", "b"])).equals(["a", "b"]).type<string[]>();
  assert(length.parse(["a"])).equals(["a"]).type<string[]>();
  assert(length.parse([])).equals([]).type<string[]>();
  assert(() => length.parse(["a", "b", "c"])).throws("length out of range");
});

test.case("object", assert => {
  //const rc = array({ foo: string });
});
