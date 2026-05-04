import type BigUintDataType from "#BigUintDataType";
import type BigUintType from "#BigUintType";
import type DefaultType from "#DefaultType";
import test from "#test";

export default <T extends BigUintDataType>(
  t: {
    vanilla: BigUintType<T>;
    loose: BigUintType<T, true>;
    strict: BigUintType<T, false>;
  }, min: bigint, max: bigint) => {

  const { strict, loose } = t;

  test.case("fail", assert => {
    assert(strict).invalid_type(["1", 0, 1, 1.1, -1.1]);
  });

  test.case("pass", assert => {
    assert(strict).type<BigUintType<T, false>>();

    assert(strict.parse(0n)).equals(0n).type<bigint>();
    assert(strict.parse(1n)).equals(1n).type<bigint>();
  });

  test.case("range", assert => {
    assert(strict.parse(min)).equals(min).type<bigint>();
    assert(strict.parse(max)).equals(max).type<bigint>();

    assert(strict).out_of_range([-1n, min - 1n, max + 1n]);
  });

  test.case("loose", assert => {
    assert(loose).type<BigUintType<T, true>>();
    assert(loose.parse(0n)).equals(0n).type<bigint>();
    assert(loose.parse(1n)).equals(1n).type<bigint>();
    assert(loose.parse(0)).equals(0n).type<bigint>();
    assert(loose.parse(1)).equals(1n).type<bigint>();
    assert(loose.parse("1")).equals(1n).type<bigint>();
    assert(loose.parse("1.0")).equals(1n).type<bigint>();
    assert(loose.parse("1.")).equals(1n).type<bigint>();
    assert(loose).invalid_type(["0.1", .1, "-0.1", "-.1"]);
    assert(loose).out_of_range([-1, "-1", "-1.0", "-1."]);
  });

  test.case("default", assert => {
    [strict.default(1n), strict.default(() => 1n)].forEach(d => {
      assert(d).type<DefaultType<BigUintType<T, false>, 1n>>();
      assert(d.parse(undefined)).equals(1n).type<bigint>();
      assert(d.parse(1n)).equals(1n).type<bigint>();
      assert(d.parse(0n)).equals(0n).type<bigint>();
      assert(d).invalid_type([1.2, -1.2]);
    });

    [strict.default(-1n), strict.default(() => -1n)].forEach(d => {
      assert(d).type<DefaultType<BigUintType<T, false>, -1n>>();
      assert(d).out_of_range([undefined]);
      assert(d.parse(1n)).equals(1n).type<bigint>();
      assert(d.parse(0n)).equals(0n).type<bigint>();
    });
  });

  test.case("validator - range", assert => {
    const r = strict.range(0n, 10n);
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n, -11n, 11n]);
  });

  test.case("validator - min", assert => {
    const r = strict.min(10n);
    assert(r.parse(20n)).equals(20n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n]);
    assert(r).too_small([0n]);
  });

  test.case("validator - max", assert => {
    const r = strict.max(10n);
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n]);
    assert(r).too_large([11n]);
  });
};
