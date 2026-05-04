import UintType from "#UintType";
import range from "#validator/range";

const from: number = 0;
const to: number = 2 ** 8 - 1;

const vanilla = new UintType("u8", undefined, [range(from, to)]);
const loose = new UintType("u8", true, [range(from, to)]);
const strict = new UintType("u8", false, [range(from, to)]);

const u8 = { vanilla, loose, strict };

export default u8;
