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
  assert(e.validate([])).equals([]).type<[]>();
});

test.case("flat", assert => {
  assert(s).type<TupleType<[StringType]>>();
  assert(s.validate(f)).equals(f).type<[string]>();

  assert(s_s).type<TupleType<[StringType, StringType]>>();
  assert(s_s.validate(x(f))).equals(x(f)).type<[string, string]>();

  assert(s_n).type<TupleType<[StringType, NumberType]>>();
  assert(s_n.validate(fb)).equals(fb).type<[string, number]>();

  assert(s_n_b).type<TupleType<[StringType, NumberType, BooleanType]>>();
  assert(s_n_b.validate(fbb)).equals(fbb).type<[string, number, boolean]>();

  assert(() => s.validate([])).throws(expect("s", undefined, 0));
  assert(() => s_n.validate(f)).throws(expect("n", undefined, 1));
  assert(() => s_n_b.validate(x(fb))).throws(expect("b", "bar", 2));
  assert(() => s_n_b.validate(x(fbb))).throws(expect("u", "bar", 3));
});

test.case("deep", assert => {
  // recursive
  const rc = tuple(tuple(string));

  assert(rc).type<TupleType<[TupleType<[StringType]>]>>();
  assert(rc.validate([["foo"]])).equals([["foo"]]).type<[[string]]>();
  assert(() => rc.validate([])).throws();
});

test.case("in array", assert => {
  const a = array(tuple(string));

  assert(a).type<ArrayType<TupleType<[StringType]>>>();
  assert(a.validate([["foo"]])).equals([["foo"]]).type<[string][]>();
  assert(a.validate([])).equals([]).type<[string][]>();

  assert(() => a.validate(undef)).throws(expect("a", undefined));
  assert(() => a.validate("foo")).throws(expect("a", "foo"));
  assert(() => a.validate([[]])).throws(expect("s", undefined, "0.0"));
  assert(() => a.validate([[false]])).throws(expect("s", false, "0.0"));
  assert(() => a.validate([["false"], "false"])).throws(expect("a", "false",
    1));
});
