import IntType from "#IntType";
import Loose from "#Loose";
import range from "#validator/range";

const from = -(2 ** 31);
const to = 2 ** 31 - 1;

const vanilla = new IntType("i32", [range(from, to)]);

const loose = new IntType("i32", [range(from, to)]);
loose[Loose] = true;

const strict = new IntType("i32", [range(from, to)]);
strict[Loose] = false;

const i32 = { vanilla, loose, strict };

export default i32;
