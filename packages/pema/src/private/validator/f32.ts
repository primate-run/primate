import ParseError from "#ParseError";

export default function f32(x: number) {
  if (x !== new Float32Array([x])[0]) {
    throw new ParseError([{
      input: x,
      message: `${x} is not a 32-bit float`,
      path: "",
    }]);
  }
}
