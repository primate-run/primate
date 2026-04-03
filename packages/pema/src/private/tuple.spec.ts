import array from "#array";
import type ArrayType from "#ArrayType";
import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import number from "#number";
import type NumberType from "#NumberType";
import string from "#string";
import type StringType from "#StringType";
import test from "#test";
import tuple from "#tuple";
import type TupleType from "#TupleType";
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

  assert(s).invalid_type([[]], "/0");
  assert(s_n).invalid_type([f], "/1");
  assert(s_n_b).invalid_type([x(fb)], "/2");
  assert(s_n_b).invalid_type([x(fbb)], "/3");
});

test.case("coerce", assert => {
  assert(s_n_b.coerce(["foo", "1", "true"]))
    .equals(["foo", 1, true])
    .type<[string, number, boolean]>();
  assert(s_n_b.coerce(["bar", "0", "false"]))
    .equals(["bar", 0, false])
    .type<[string, number, boolean]>();

  assert(s_n_b).coerce_invalid_type([["foo", "oops", "true"]], "/1");
  assert(s_n_b).coerce_invalid_type([["foo", "1", "nope"]], "/2");
});

test.case("deep", assert => {
  const rc = tuple(tuple(string));
  assert(rc).type<TupleType<[TupleType<[StringType]>]>>();
  assert(rc.parse([["foo"]])).equals([["foo"]]).type<[[string]]>();
  assert(rc).invalid_type([[]], "/0");
});

test.case("deep coerce", assert => {
  const rc = tuple(tuple(number));
  assert(rc.coerce([["1"]])).equals([[1]]).type<[[number]]>();
});

test.case("in array", assert => {
  const a = array(tuple(string));
  assert(a).type<ArrayType<TupleType<[StringType]>>>();
  assert(a.parse([["foo"]])).equals([["foo"]]).type<[string][]>();
  assert(a.parse([])).equals([]).type<[string][]>();

  assert(a).invalid_type([undef, "foo"]);
  assert(a).invalid_type([[[]], [[false]]], "/0/0");
  assert(a).invalid_type([[["false"], "false"]], "/1");
});
