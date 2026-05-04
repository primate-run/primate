import type DefaultType from "#DefaultType";
import type NumberType from "#NumberType";
import p from "#index";
import test from "#test";

test.case("fail", assert => {
  assert(p.number).invalid_type(["1", 1n]);
});

test.case("pass", assert => {
  assert(p.number).type<NumberType>();
  assert(p.number.parse(1)).equals(1).type<number>();
});

test.case("loose", assert => {
  assert(p.loose.number.parse(1)).equals(1).type<number>();
  assert(p.loose.number.parse(-1)).equals(-1).type<number>();

  assert(p.loose.number.parse("1")).equals(1).type<number>();
  assert(p.loose.number.parse("1.0")).equals(1).type<number>();
  assert(p.loose.number.parse("1.")).equals(1).type<number>();
  assert(p.loose.number.parse("0.1")).equals(0.1).type<number>();
  assert(p.loose.number.parse(".1")).equals(0.1).type<number>();

  assert(p.loose.number.parse("-1")).equals(-1).type<number>();
  assert(p.loose.number.parse("-1.0")).equals(-1).type<number>();
  assert(p.loose.number.parse("-1.")).equals(-1).type<number>();
  assert(p.loose.number.parse("-0.1")).equals(-0.1).type<number>();
  assert(p.loose.number.parse("-.1")).equals(-0.1).type<number>();
});

test.case("default", assert => {
  [p.number.default(1), p.number.default(() => 1)].forEach(d => {
    assert(d).type<DefaultType<NumberType, 1>>();
    assert(d.parse(undefined)).equals(1).type<number>();
    assert(d.parse(1)).equals(1).type<number>();
    assert(d.parse(0)).equals(0).type<number>();
    assert(d).invalid_type(["1", 1n]);
  });
});

test.case("toJSON", assert => {
  assert(p.number.toJSON()).equals({ type: "number", datatype: "f64" });
});
