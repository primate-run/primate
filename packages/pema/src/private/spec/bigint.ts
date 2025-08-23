import type BigIntDataType from "#BigIntDataType";
import type BigIntType from "#BigIntType";
import type DefaultType from "#DefaultType";
import expect from "#expect";
import test from "@rcompat/test";

export default <T extends BigIntDataType>(
  i: BigIntType<T>, min: bigint, max: bigint) => {

  test.case("fail", assert => {
    assert(() => i.parse("1")).throws(expect("bi", "1"));
    assert(() => i.parse(1.1)).throws(expect("bi", 1.1));
    assert(() => i.parse(-1.1)).throws(expect("bi", -1.1));
    assert(() => i.parse(0)).throws(expect("bi", 0));
    assert(() => i.parse(1)).throws(expect("bi", 1));
  });

  test.case("pass", assert => {
    assert(i).type<BigIntType<T>>();

    assert(i.parse(0n)).equals(0n).type<bigint>();
    assert(i.parse(1n)).equals(1n).type<bigint>();
  });

  test.case("range", assert => {
    assert(i.parse(min)).equals(min).type<bigint>();
    assert(i.parse(max)).equals(max).type<bigint>();

    assert(() => i.parse(min - 1n)).throws(`${min - 1n} is out of range`);
    assert(() => i.parse(max + 1n)).throws(`${max + 1n} is out of range`);
  });

  test.case("coerced", assert => {
    const coerced = i.coerce;
    assert(coerced.parse(0n)).equals(0n).type<bigint>();
    assert(coerced.parse(1n)).equals(1n).type<bigint>();
    assert(coerced.parse(0)).equals(0n).type<bigint>();
    assert(coerced.parse(1)).equals(1n).type<bigint>();
    assert(coerced.parse("1")).equals(1n).type<bigint>();
    assert(coerced.parse("1.0")).equals(1n).type<bigint>();
    assert(coerced.parse("1.")).equals(1n).type<bigint>();
    assert(() => coerced.parse("0.1")).throws(expect("bi", "0.1"));
    assert(() => coerced.parse(".1")).throws(expect("bi", ".1"));

    assert(coerced.parse(-1)).equals(-1n).type<bigint>();
    assert(coerced.parse("-1")).equals(-1n).type<bigint>();
    assert(coerced.parse("-1.0")).equals(-1n).type<bigint>();
    assert(coerced.parse("-1.")).equals(-1n).type<bigint>();
    assert(() => coerced.parse("-0.1")).throws(expect("bi", "-0.1"));
    assert(() => coerced.parse("-.1")).throws(expect("bi", "-.1"));
  });

  test.case("default", assert => {
    [i.default(1n), i.default(() => 1n)].forEach(d => {
      assert(d).type<DefaultType<BigIntType<T>, 1n>>();
      assert(d.parse(undefined)).equals(1n).type<bigint>();
      assert(d.parse(1n)).equals(1n).type<bigint>();
      assert(d.parse(0n)).equals(0n).type<bigint>();
      assert(() => d.parse(1.2)).throws(expect("bi", 1.2));
      assert(() => d.parse(-1.2)).throws(expect("bi", -1.2));
    });
  });

  test.case("validator - range", assert => {
    const r = i.range(-10n, 10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();

    assert(() => r.parse(-11n)).throws("-11 is out of range");
    assert(() => r.parse(11n)).throws("11 is out of range");
  });

  test.case("validator - min", assert => {
    const r = i.min(-10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();

    assert(() => r.parse(-11n)).throws("-11 is lower than min (-10)");
  });

  test.case("validator - max", assert => {
    const r = i.max(10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();

    assert(() => r.parse(11n)).throws("11 is greater than max (10)");
  });
};
