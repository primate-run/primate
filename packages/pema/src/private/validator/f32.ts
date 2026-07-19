import E from "#errors";
import is from "@rcompat/is";

export default function f32(x: number) {
  if (!is.f32(x)) throw E.out_of_range(x, `${x} is not a 32-bit float`);
}
