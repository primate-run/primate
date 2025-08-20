import type DefaultType from "#DefaultType";
import expect from "#expect";
import type UintDataType from "#UintDataType";
import type UintType from "#UintType";
import test from "@rcompat/test";

export default <T extends UintDataType>(
  i: UintType<T>, min: number, max: number) => {
  test.case("fail", assert => {
    assert(() => i.parse("1")).throws(expect("n", "1"));
    assert(() => i.parse(1.1)).throws("1.1 is not an integer");
    assert(() => i.parse(-1.1)).throws("-1.1 is not an integer");
    assert(() => i.parse(-1)).throws("-1 is out of range");
    assert(() => i.parse(1n)).throws(expect("n", 1n));
  });

  test.case("pass", assert => {
    assert(i).type<UintType<T>>();

    assert(i.parse(1)).equals(1).type<number>();
  });

  test.case("range", assert => {
    assert(i.parse(0)).equals(0).type<number>();
    assert(i.parse(min)).equals(min).type<number>();
    assert(i.parse(max)).equals(max).type<number>();

    assert(() => i.parse(min - 1)).throws(`${min - 1} is out of range`);
    assert(() => i.parse(max + 1)).throws(`${max + 1} is out of range`);
  });

  test.case("coerced", assert => {
    const coerced = i.coerce;
    assert(coerced.parse(0)).equals(0).type<number>();
    assert(coerced.parse(1)).equals(1).type<number>();
    assert(coerced.parse("1")).equals(1).type<number>();
    assert(coerced.parse("1.0")).equals(1).type<number>();
    assert(coerced.parse("1.")).equals(1).type<number>();
    assert(() => coerced.parse("0.1")).throws("0.1 is not an integer");
    assert(() => coerced.parse(".1")).throws("0.1 is not an integer");
    assert(() => coerced.parse("-1")).throws("-1 is out of range");
    assert(() => coerced.parse("-1.0")).throws("-1 is out of range");
    assert(() => coerced.parse("-1.")).throws("-1 is out of range");
  });

  test.case("default", assert => {
    [i.default(1), i.default(() => 1)].forEach(d => {
      assert(d).type<DefaultType<UintType<T>, 1>>();
      assert(d.parse(undefined)).equals(1).type<number>();
      assert(d.parse(1)).equals(1).type<number>();
      assert(d.parse(0)).equals(0).type<number>();
      assert(() => d.parse(1.2)).throws("1.2 is not an integer");
      assert(() => d.parse(-1.2)).throws("-1.2 is not an integer");
    });

    [i.default(-1), i.default(() => -1)].forEach(d => {
      assert(d).type<DefaultType<UintType<T>, -1>>();
      assert(() => d.parse(undefined)).throws("-1 is out of range");
      assert(d.parse(1)).equals(1).type<number>();
      assert(d.parse(0)).equals(0).type<number>();
    });
  });
};
