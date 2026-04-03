import type BigUintDataType from "#BigUintDataType";
import type BigUintType from "#BigUintType";
import type DefaultType from "#DefaultType";
import test from "#test";

export default <T extends BigUintDataType>(
  t: BigUintType<T>, min: bigint, max: bigint) => {
  test.case("fail", assert => {
    assert(t).invalid_type(["1", 0, 1, 1.1, -1.1]);
  });

  test.case("pass", assert => {
    assert(t).type<BigUintType<T>>();

    assert(t.parse(0n)).equals(0n).type<bigint>();
    assert(t.parse(1n)).equals(1n).type<bigint>();
  });

  test.case("range", assert => {
    assert(t.parse(min)).equals(min).type<bigint>();
    assert(t.parse(max)).equals(max).type<bigint>();

    assert(t).out_of_range([-1n, min - 1n, max + 1n]);
  });

  test.case("coerced", assert => {
    assert(t.coerce(0n)).equals(0n).type<bigint>();
    assert(t.coerce(1n)).equals(1n).type<bigint>();
    assert(t.coerce(0)).equals(0n).type<bigint>();
    assert(t.coerce(1)).equals(1n).type<bigint>();
    assert(t.coerce("1")).equals(1n).type<bigint>();
    assert(t.coerce("1.0")).equals(1n).type<bigint>();
    assert(t.coerce("1.")).equals(1n).type<bigint>();
    assert(t).coerce_invalid_type(["0.1", .1, "-0.1", "-.1"]);
    assert(t).coerce_out_of_range([-1, "-1", "-1.0", "-1."]);
  });

  test.case("default", assert => {
    [t.default(1n), t.default(() => 1n)].forEach(d => {
      assert(d).type<DefaultType<BigUintType<T>, 1n>>();
      assert(d.parse(undefined)).equals(1n).type<bigint>();
      assert(d.parse(1n)).equals(1n).type<bigint>();
      assert(d.parse(0n)).equals(0n).type<bigint>();
      assert(d).invalid_type([1.2, -1.2]);
    });
  });

  test.case("validator - range", assert => {
    const r = t.range(0n, 10n);
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n, -11n, 11n]);
  });

  test.case("validator - min", assert => {
    const r = t.min(10n);
    assert(r.parse(20n)).equals(20n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n]);
    assert(r).too_small([0n]);
  });

  test.case("validator - max", assert => {
    const r = t.max(10n);
    assert(r.parse(0n)).equals(0n).type<bigint>();
    assert(r.parse(10n)).equals(10n).type<bigint>();
    assert(r).out_of_range([-1n]);
    assert(r).too_large([11n]);
  });
};
