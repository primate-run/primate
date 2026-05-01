import IntType from "#IntType";
import Loose from "#Loose";
import range from "#validator/range";

const from: number = -(2 ** 7);
const to: number = 2 ** 7 - 1;

const vanilla = new IntType("i8", [range(from, to)]);

const loose = new IntType("i8", [range(from, to)]);
loose[Loose] = true;

const strict = new IntType("i8", [range(from, to)]);
strict[Loose] = false;

const i8 = { vanilla, loose, strict };

export default i8;
