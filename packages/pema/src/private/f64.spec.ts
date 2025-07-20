import type DefaultType from "#DefaultType";
import expect from "#expect";
import number from "#number";
import type NumberType from "#NumberType";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => number.validate("1")).throws(expect("n", "1"));
  assert(() => number.validate(1n)).throws(expect("n", 1n));
});

test.case("pass", assert => {
  assert(number).type<NumberType>();
  assert(number.validate(1)).equals(1).type<number>();
});

test.case("default", assert => {
  [number.default(1), number.default(() => 1)].forEach(d => {
    assert(d).type<DefaultType<NumberType, 1>>();
    assert(d.validate(undefined)).equals(1).type<number>();
    assert(d.validate(1)).equals(1).type<number>();
    assert(d.validate(0)).equals(0).type<number>();
    assert(() => d.validate("1")).throws(expect("n", "1"));
  });
});
