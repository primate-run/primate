import expect from "#expect";
import fn from "#function";
import type FunctionType from "#FunctionType";
import type OptionalType from "#OptionalType";
import test from "@rcompat/test";
import type { UnknownFunction } from "@rcompat/type";

test.case("fail", assert => {
  assert(() => fn.parse("foo")).throws(expect("fn", "foo"));
  assert(() => fn.parse(1)).throws(expect("fn", 1));
  assert(() => fn.parse(true)).throws(expect("fn", true));
  assert(() => fn.parse(null)).throws(expect("fn", null));
  assert(() => fn.parse({})).throws(expect("fn", {}));
  assert(() => fn.parse([])).throws(expect("fn", []));
});

test.case("pass", assert => {
  assert(fn).type<FunctionType>();

  const arrow = () => { };
  assert(fn.parse(arrow)).equals(arrow).type<UnknownFunction>();

  const named = function named() { };
  assert(fn.parse(named)).equals(named).type<UnknownFunction>();

  const asyncFn = async () => { };
  assert(fn.parse(asyncFn)).equals(asyncFn).type<UnknownFunction>();

  assert(fn.parse(Math.max)).equals(Math.max).type<UnknownFunction>();
});

test.case("optional", assert => {
  const maybe = fn.optional();
  assert(maybe).type<OptionalType<FunctionType>>();

  assert(maybe.parse(undefined)).equals(undefined);

  const f = () => 42;
  assert(maybe.parse(f)).equals(f);

  assert(() => maybe.parse("not a fn")).throws(expect("fn", "not a fn"));
});

test.case("toJSON", assert => {
  assert(fn.toJSON())
    .type<{ type: "function" }>()
    .equals({ type: "function" });
});
