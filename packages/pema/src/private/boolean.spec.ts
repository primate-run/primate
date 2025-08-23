import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import type DefaultType from "#DefaultType";
import expect from "#expect";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => boolean.parse("true")).throws(expect("b", "true"));
  assert(() => boolean.parse("false")).throws(expect("b", "false"));
});

test.case("pass", assert => {
  assert(boolean).type<BooleanType>();

  assert(boolean.parse(true)).equals(true).type<boolean>();
  assert(boolean.parse(false)).equals(false).type<boolean>();
});

test.case("coerce", assert => {
  const coerced = boolean.coerce;
  assert(coerced).type<BooleanType>();
  assert(coerced.parse(true)).equals(true).type<boolean>();
  assert(coerced.parse(false)).equals(false).type<boolean>();
  assert(coerced.parse("true")).equals(true).type<boolean>();
  assert(coerced.parse("false")).equals(false).type<boolean>();
  assert(() => coerced.parse("1")).throws(expect("b", "1"));
  assert(() => coerced.parse("0")).throws(expect("b", "0"));
});

test.case("default", assert => {
  [boolean.default(true), boolean.default(() => true)].forEach(d => {
    assert(d).type<DefaultType<BooleanType, true>>();
    assert(d.parse(undefined)).equals(true).type<boolean>();
    assert(d.parse(true)).equals(true).type<boolean>();
    assert(d.parse(false)).equals(false).type<boolean>();
    assert(() => d.parse("true")).throws(expect("b", "true"));
  });
});
