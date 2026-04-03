import type DefaultType from "#DefaultType";
import type IntDataType from "#IntDataType";
import type IntType from "#IntType";
import test from "#test";

export default <T extends IntDataType>(
  t: IntType<T>, min: number, max: number) => {

  test.case("fail", assert => {
    assert(t).invalid_type(["1", 0n, 1n, 1.1, -1.1]);
  });

  test.case("pass", assert => {
    assert(t).type<IntType<T>>();

    assert(t.parse(0)).equals(0).type<number>();
    assert(t.parse(1)).equals(1).type<number>();
  });

  test.case("range", assert => {
    assert(t.parse(min)).equals(min).type<number>();
    assert(t.parse(max)).equals(max).type<number>();
    assert(t).out_of_range([min - 1, max + 1]);
  });

  test.case("coerced", assert => {
    assert(t.coerce(0)).equals(0).type<number>();
    assert(t.coerce(1)).equals(1).type<number>();
    assert(t.coerce("1")).equals(1).type<number>();
    assert(t.coerce("1.0")).equals(1).type<number>();
    assert(t.coerce("1.")).equals(1).type<number>();
    assert(t).invalid_type(["0.1", ".1"]);

    assert(t.coerce("-1")).equals(-1).type<number>();
    assert(t.coerce("-1.0")).equals(-1).type<number>();
    assert(t.coerce("-1.")).equals(-1).type<number>();
    assert(t).invalid_type(["-0.1", "-.1"]);
  });

  test.case("default", assert => {
    [t.default(1), t.default(() => 1)].forEach(d => {
      assert(d).type<DefaultType<IntType<T>, 1>>();
      assert(d.parse(undefined)).equals(1).type<number>();
      assert(d.parse(1)).equals(1).type<number>();
      assert(d.parse(0)).equals(0).type<number>();
      assert(d).invalid_type(["1.2", "-1.2"]);
    });
  });

  test.case("validator - range", assert => {
    const r = t.range(-10, 10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).out_of_range([-11, 11]);
  });

  test.case("validator - min", assert => {
    const r = t.min(-10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).too_small([-11]);
  });

  test.case("validator - max", assert => {
    const r = t.max(10);
    assert(r.parse(-10)).equals(-10).type<number>();
    assert(r.parse(0)).equals(0).type<number>();
    assert(r.parse(10)).equals(10).type<number>();
    assert(r).too_large([11]);
  });
};
