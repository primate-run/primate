import IntType from "#IntType";
import Loose from "#Loose";
import range from "#validator/range";

const from = -(2 ** 15);
const to = 2 ** 15 - 1;

const vanilla = new IntType("i16", [range(from, to)]);

const loose = new IntType("i16", [range(from, to)]);
loose[Loose] = true;

const strict = new IntType("i16", [range(from, to)]);
strict[Loose] = false;

const i16 = { vanilla, loose, strict };

export default i16;
