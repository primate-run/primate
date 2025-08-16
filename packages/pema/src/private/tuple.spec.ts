import array from "#array";
import type ArrayType from "#ArrayType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import expect from "#expect";
import number from "#number";
import type NumberType from "#NumberType";
import string from "#string";
import type StringType from "#StringType";
import tuple from "#tuple";
import type TupleType from "#TupleType";
import test from "@rcompat/test";
import undef from "@rcompat/test/undef";

const e = tuple();
const s = tuple(string);
const s_s = tuple(string, string);
const s_n = tuple(string, number);
const s_n_b = tuple(string, number, boolean);

const f = ["bar"];
const fb = ["bar", 0];
const fbb = ["bar", 0, false];

const x = <T>(t: T, length = 2) => Array.from({ length }, _ => t).flat();

test.case("empty", assert => {
  assert(e).type<TupleType<[]>>();
  assert(e.parse([])).equals([]).type<[]>();
});

test.case("flat", assert => {
  assert(s).type<TupleType<[StringType]>>();
  assert(s.parse(f)).equals(f).type<[string]>();

  assert(s_s).type<TupleType<[StringType, StringType]>>();
  assert(s_s.parse(x(f))).equals(x(f)).type<[string, string]>();

  assert(s_n).type<TupleType<[StringType, NumberType]>>();
  assert(s_n.parse(fb)).equals(fb).type<[string, number]>();

  assert(s_n_b).type<TupleType<[StringType, NumberType, BooleanType]>>();
  assert(s_n_b.parse(fbb)).equals(fbb).type<[string, number, boolean]>();

  assert(() => s.parse([])).throws(expect("s", undefined, 0));
  assert(() => s_n.parse(f)).throws(expect("n", undefined, 1));
  assert(() => s_n_b.parse(x(fb))).throws(expect("b", "bar", 2));
  assert(() => s_n_b.parse(x(fbb))).throws(expect("u", "bar", 3));
});

test.case("deep", assert => {
  // recursive
  const rc = tuple(tuple(string));

  assert(rc).type<TupleType<[TupleType<[StringType]>]>>();
  assert(rc.parse([["foo"]])).equals([["foo"]]).type<[[string]]>();
  assert(() => rc.parse([])).throws();
});

test.case("in array", assert => {
  const a = array(tuple(string));

  assert(a).type<ArrayType<TupleType<[StringType]>>>();
  assert(a.parse([["foo"]])).equals([["foo"]]).type<[string][]>();
  assert(a.parse([])).equals([]).type<[string][]>();

  assert(() => a.parse(undef)).throws(expect("a", undefined));
  assert(() => a.parse("foo")).throws(expect("a", "foo"));
  assert(() => a.parse([[]])).throws(expect("s", undefined, "0.0"));
  assert(() => a.parse([[false]])).throws(expect("s", false, "0.0"));
  assert(() => a.parse([["false"], "false"])).throws(expect("a", "false",
    1));
});
