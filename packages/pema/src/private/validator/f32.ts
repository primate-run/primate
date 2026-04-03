import E from "#errors";

export default function f32(x: number) {
  if (x !== new Float32Array([x])[0]) throw E.out_of_range(x,
    `${x} is not a 32-bit float`);
}
