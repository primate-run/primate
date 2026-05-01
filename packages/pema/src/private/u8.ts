import Loose from "#Loose";
import UintType from "#UintType";
import range from "#validator/range";

const from: number = 0;
const to: number = 2 ** 8 - 1;

const vanilla = new UintType("u8", [range(from, to)]);

const loose = new UintType("u8", [range(from, to)]);
loose[Loose] = true;

const strict = new UintType("u8", [range(from, to)]);
strict[Loose] = false;

const u8 = { vanilla, loose, strict };

export default u8;
