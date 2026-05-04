import IntType from "#IntType";
import range from "#validator/range";

const from = -(2 ** 31);
const to = 2 ** 31 - 1;

const vanilla = new IntType("i32", undefined, [range(from, to)]);
const loose = new IntType("i32", true, [range(from, to)]);
const strict = new IntType("i32", false, [range(from, to)]);
const i32 = { vanilla, loose, strict };

export default i32;
