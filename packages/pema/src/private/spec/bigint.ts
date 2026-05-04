import type BigIntDataType from "#BigIntDataType";
import type BigIntType from "#BigIntType";
import type DefaultType from "#DefaultType";
import test from "#test";

export default <T extends BigIntDataType>(
  t: {
    vanilla: BigIntType<T>;
    loose: BigIntType<T, true>;
    strict: BigIntType<T, false>;
  }, min: bigint, max: bigint) => {

  const { strict, loose } = t;

  test.case("fail", assert => {
    assert(strict).invalid_type(["1", 1.1, -1.1, 0, 1]);
  });

  test.case("pass", assert => {
    assert(strict).type<BigIntType<T, false>>();

    assert(strict.parse(0n)).equals(0n).type<bigint>();
    assert(strict.parse(1n)).equals(1n).type<bigint>();
  });

  test.case("range", assert => {
    assert(strict.parse(min)).equals(min).type<bigint>();
    assert(strict.parse(max)).equals(max).type<bigint>();
    assert(strict).out_of_range([min - 1n, max + 1n]);
  });

  test.case("loose", assert => {
    assert(loose).type<BigIntType<T, true>>();
    assert(loose.parse(0n)).equals(0n).type<bigint>();
    assert(loose.parse(1n)).equals(1n).type<bigint>();
    assert(loose.parse(0)).equals(0n).type<bigint>();
    assert(loose.parse(1)).equals(1n).type<bigint>();
    assert(loose.parse("1")).equals(1n).type<bigint>();
    assert(loose.parse("1.0")).equals(1n).type<bigint>();
    assert(loose.parse("1.")).equals(1n).type<bigint>();
    assert(loose).invalid_type(["0.1", ".1"]);

    assert(loose.parse(-1)).equals(-1n).type<bigint>();
    assert(loose.parse("-1")).equals(-1n).type<bigint>();
    assert(loose.parse("-1.0")).equals(-1n).type<bigint>();
    assert(loose.parse("-1.")).equals(-1n).type<bigint>();
    assert(loose).invalid_type(["-0.1", "-.1"]);
  });

  test.case("default", assert => {
    [strict.default(1n), strict.default(() => 1n)].forEach(d => {
      assert(d).type<DefaultType<BigIntType<T, false>, 1n>>();
      assert(d.parse(undefined)).equals(1n).type<bigint>();
      assert(d.parse(1n)).equals(1n).type<bigint>();
      assert(d.parse(0n)).equals(0n).type<bigint>();
      assert(d).invalid_type([1.2, -1.2]);
    });
  });

  test.case("validator - range", assert => {
    const r = strict.range(-10n, 10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-11n, 11n]);
  });

  test.case("validator - min", assert => {
    const r = strict.min(-10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).too_small([-11n]);
  });

  test.case("validator - max", assert => {
    const r = strict.max(10n);
    assert(r.parse(-10n)).equals(-10n).type<bigint>();
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).too_large([11n]);
  });
};
