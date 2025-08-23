import type DefaultType from "#DefaultType";
import expect from "#expect";
import number from "#number";
import type NumberType from "#NumberType";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => number.parse("1")).throws(expect("n", "1"));
  assert(() => number.parse(1n)).throws(expect("n", 1n));
});

test.case("pass", assert => {
  assert(number).type<NumberType>();
  assert(number.parse(1)).equals(1).type<number>();
});

test.case("coerce", assert => {
  const coerced = number.coerce;
  assert(coerced).type<NumberType>();
  assert(coerced.parse(1)).equals(1).type<number>();
  assert(coerced.parse(-1)).equals(-1).type<number>();

  assert(coerced.parse("1")).equals(1).type<number>();
  assert(coerced.parse("1.0")).equals(1).type<number>();
  assert(coerced.parse("1.")).equals(1).type<number>();
  assert(coerced.parse("0.1")).equals(0.1).type<number>();
  assert(coerced.parse(".1")).equals(0.1).type<number>();

  assert(coerced.parse("-1")).equals(-1).type<number>();
  assert(coerced.parse("-1.0")).equals(-1).type<number>();
  assert(coerced.parse("-1.")).equals(-1).type<number>();
  assert(coerced.parse("-0.1")).equals(-0.1).type<number>();
  assert(coerced.parse("-.1")).equals(-0.1).type<number>();
});

test.case("default", assert => {
  [number.default(1), number.default(() => 1)].forEach(d => {
    assert(d).type<DefaultType<NumberType, 1>>();
    assert(d.parse(undefined)).equals(1).type<number>();
    assert(d.parse(1)).equals(1).type<number>();
    assert(d.parse(0)).equals(0).type<number>();
    assert(() => d.parse("1")).throws(expect("n", "1"));
  });
});
