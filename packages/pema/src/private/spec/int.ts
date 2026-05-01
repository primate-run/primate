import type DefaultType from "#DefaultType";
import type IntDataType from "#IntDataType";
import type IntType from "#IntType";
import test from "#test";

export default <T extends IntDataType>(
  t: { loose: IntType<T>; strict: IntType<T> }, min: number, max: number) => {

  const { strict, loose } = t;

  test.case("fail", assert => {
    assert(strict).invalid_type(["1", 0n, 1n, 1.1, -1.1]);
  });

  test.case("pass", assert => {
    assert(strict).type<IntType<T>>();

    assert(strict.parse(0)).equals(0).type<number>();
    assert(strict.parse(1)).equals(1).type<number>();
  });

  test.case("range", assert => {
    assert(strict.parse(min)).equals(min).type<number>();
    assert(strict.parse(max)).equals(max).type<number>();
    assert(strict).out_of_range([min - 1, max + 1]);
  });

  test.case("loose", assert => {
    assert(loose.parse(0)).equals(0).type<number>();
    assert(loose.parse(1)).equals(1).type<number>();
    assert(loose.parse("1")).equals(1).type<number>();
    assert(loose.parse("1.0")).equals(1).type<number>();
    assert(loose.parse("1.")).equals(1).type<number>();
    assert(strict).invalid_type(["0.1", ".1"]);

    assert(loose.parse("-1")).equals(-1).type<number>();
    assert(loose.parse("-1.0")).equals(-1).type<number>();
    assert(loose.parse("-1.")).equals(-1).type<number>();
    assert(strict).invalid_type(["-0.1", "-.1"]);
  });

  test.case("default", assert => {
    [strict.default(1), strict.default(() => 1)].forEach(d => {
      assert(d).type<DefaultType<IntType<T>, 1>>();
      assert(d.parse(undefined)).equals(1).type<number>();
      assert(d.parse(1)).equals(1).type<number>();
      assert(d.parse(0)).equals(0).type<number>();
      assert(d).invalid_type(["1.2", "-1.2"]);
    });
  });

  test.case("validator - range", assert => {
    const r = strict.range(-10, 10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).out_of_range([-11, 11]);
  });

  test.case("validator - min", assert => {
    const r = strict.min(-10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).too_small([-11]);
  });

  test.case("validator - max", assert => {
    const r = strict.max(10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).too_large([11]);
  });
};
