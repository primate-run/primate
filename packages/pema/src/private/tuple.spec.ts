import type ArrayType from "#ArrayType";
import type BooleanType from "#BooleanType";
import p from "#index";
import type NumberType from "#NumberType";
import type StringType from "#StringType";
import test from "#test";
import type TupleType from "#TupleType";
import undef from "@rcompat/test/undef";

const e = p.tuple();
const s = p.tuple(p.string);
const s_s = p.tuple(p.string, p.string);
const s_n = p.tuple(p.string, p.number);
const s_n_b = p.tuple(p.string, p.number, p.boolean);
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

test.case("loose", assert => {
  const s_n_b_l = p.loose.tuple(p.string, p.number, p.boolean);
  assert(s_n_b_l.parse(["foo", "1", "true"]))
    .equals(["foo", 1, true])
    .type<[string, number, boolean]>();
  assert(s_n_b_l.parse(["bar", "0", "false"]))
    .equals(["bar", 0, false])
    .type<[string, number, boolean]>();

  assert(s_n_b_l).invalid_type([["foo", "oops", "true"]], "/1");
  assert(s_n_b_l).invalid_type([["foo", "1", "nope"]], "/2");
});

test.case("deep", assert => {
  const rc = p.tuple(p.tuple(p.string));
  assert(rc).type<TupleType<[TupleType<[StringType]>]>>();
  assert(rc.parse([["foo"]])).equals([["foo"]]).type<[[string]]>();
  assert(rc).invalid_type([[]], "/0");
});

test.case("deep loose", assert => {
  const rc = p.loose.tuple(p.tuple(p.number));
  assert(rc.parse([["1"]])).equals([[1]]).type<[[number]]>();
});

test.case("in p.array", assert => {
  const a = p.array(p.tuple(p.string));
  assert(a).type<ArrayType<TupleType<[StringType]>>>();
  assert(a.parse([["foo"]])).equals([["foo"]]).type<[string][]>();
  assert(a.parse([])).equals([]).type<[string][]>();

  assert(a).invalid_type([undef, "foo"]);
  assert(a).invalid_type([[[]], [[false]]], "/0/0");
  assert(a).invalid_type([[["false"], "false"]], "/1");
});
