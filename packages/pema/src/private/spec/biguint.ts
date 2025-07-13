import type BigUintDataType from "#BigUintDataType";
import type BigUintType from "#BigUintType";
import type DefaultType from "#DefaultType";
import expect from "#expect";
import test from "@rcompat/test";

export default <T extends BigUintDataType>(
  i: BigUintType<T>, min: bigint, max: bigint) => {
  test.case("fail", assert => {
    assert(() => i.validate("1")).throws(expect("bi", "1"));
    assert(() => i.validate(1.1)).throws(expect("bi", 1.1));
    assert(() => i.validate(-1.1)).throws(expect("bi", -1.1));
    assert(() => i.validate(-1n)).throws("-1 out of range");
    assert(() => i.validate(0)).throws(expect("bi", 0));
    assert(() => i.validate(1)).throws(expect("bi", 1));
  });

  test.case("pass", assert => {
    assert(i).type<BigUintType<T>>();

    assert(i.validate(0n)).equals(0n).type<bigint>();
    assert(i.validate(1n)).equals(1n).type<bigint>();
  });

  test.case("range", assert => {
    assert(i.validate(min)).equals(min).type<bigint>();
    assert(i.validate(max)).equals(max).type<bigint>();

    assert(() => i.validate(min - 1n)).throws(`${min - 1n} out of range`);
    assert(() => i.validate(max + 1n)).throws(`${max + 1n} out of range`);
  });

  test.case("default", assert => {
    [i.default(1n), i.default(() => 1n)].forEach(d => {
      assert(d).type<DefaultType<BigUintType<T>, 1n>>();
      assert(d.validate(undefined)).equals(1n).type<bigint>();
      assert(d.validate(1n)).equals(1n).type<bigint>();
      assert(d.validate(0n)).equals(0n).type<bigint>();
      assert(() => d.validate(1.2)).throws(expect("bi", 1.2));
      assert(() => d.validate(-1.2)).throws(expect("bi", -1.2));
    });
  });
};
