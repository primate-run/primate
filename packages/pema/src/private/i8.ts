import IntType from "#IntType";
import range from "#validator/range";

const from: number = -(2 ** 7);
const to: number = 2 ** 7 - 1;

const vanilla = new IntType("i8", undefined, [range(from, to)]);
const loose = new IntType("i8", true, [range(from, to)]);
const strict = new IntType("i8", false, [range(from, to)]);

const i8 = { vanilla, loose, strict };

export default i8;
