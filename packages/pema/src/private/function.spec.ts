import fn from "#function";
import type FunctionType from "#FunctionType";
import type OptionalType from "#OptionalType";
import test from "#test";
import type { UnknownFunction } from "@rcompat/type";

test.case("fail", assert => {
  assert(fn).invalid_type(["foo", 1, true, null, undefined, {}, []]);
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
  function* gen() { yield 1; }
  assert(fn.parse(gen)).equals(gen).type<UnknownFunction>();
});

test.case("optional", assert => {
  const maybe = fn.optional();
  assert(maybe).type<OptionalType<FunctionType>>();
  assert(maybe.parse(undefined)).equals(undefined);
  const f = () => 42;
  assert(maybe.parse(f)).equals(f);
  assert(maybe).invalid_type(["not a fn", null]);
});

test.case("toJSON", assert => {
  assert(fn.toJSON())
    .type<{ type: "function" }>()
    .equals({ type: "function" });
});
