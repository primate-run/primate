import IntType from "#IntType";
import range from "#validator/range";

const from = -(2 ** 15);
const to = 2 ** 15 - 1;

const vanilla = new IntType("i16", undefined, [range(from, to)]);
const loose = new IntType("i16", true, [range(from, to)]);
const strict = new IntType("i16", false, [range(from, to)]);

const i16 = { vanilla, loose, strict };

export default i16;
