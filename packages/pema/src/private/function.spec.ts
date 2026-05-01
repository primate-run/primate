import type FunctionType from "#FunctionType";
import p from "#index";
import type OptionalType from "#OptionalType";
import test from "#test";
import type { UnknownFunction } from "@rcompat/type";

test.case("fail", assert => {
  assert(p.function).invalid_type(["foo", 1, true, null, undefined, {}, []]);
});

test.case("pass", assert => {
  assert(p.function).type<FunctionType>();
  const arrow = () => { };
  assert(p.function.parse(arrow)).equals(arrow).type<UnknownFunction>();
  const named = function named() { };
  assert(p.function.parse(named)).equals(named).type<UnknownFunction>();
  const async_fn = async () => { };
  assert(p.function.parse(async_fn)).equals(async_fn).type<UnknownFunction>();
  assert(p.function.parse(Math.max)).equals(Math.max).type<UnknownFunction>();
  function* gen() { yield 1; }
  assert(p.function.parse(gen)).equals(gen).type<UnknownFunction>();
});

test.case("optional", assert => {
  const maybe = p.function.optional();
  assert(maybe).type<OptionalType<FunctionType>>();
  assert(maybe.parse(undefined)).equals(undefined);
  const f = () => 42;
  assert(maybe.parse(f)).equals(f);
  assert(maybe).invalid_type(["not a p.function", null]);
});

test.case("toJSON", assert => {
  assert(p.function.toJSON())
    .type<{ type: "function" }>()
    .equals({ type: "function" });
});
