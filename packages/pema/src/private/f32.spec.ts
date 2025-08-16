import f32 from "#f32";
import type NumberType from "#NumberType";
import test from "@rcompat/test";

test.case("fail", assert => {
  const n = 1.23456789012345;
  assert(() => f32.parse(n)).throws(`${n} is not a 32-bit float`);
});

test.case("pass", assert => {
  assert(f32).type<NumberType<"f32">>();

  assert(f32.parse(1.5)).equals(1.5).type<number>();
  assert(f32.parse(123456.75)).equals(123456.75).type<number>();
});
