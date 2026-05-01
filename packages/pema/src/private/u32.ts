import Loose from "#Loose";
import UintType from "#UintType";
import range from "#validator/range";

const from: number = 0;
const to: number = 2 ** 32 - 1;

/**
* Value is an unsigned integer.
*/
const vanilla = new UintType("u32", [range(from, to)]);

const loose = new UintType("u32", [range(from, to)]);
loose[Loose] = true;

const strict = new UintType("u32", [range(from, to)]);
strict[Loose] = false;

const u32 = { vanilla, loose, strict };

export default u32;
