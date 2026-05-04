import UintType from "#UintType";
import range from "#validator/range";

const from: number = 0;
const to: number = 2 ** 32 - 1;

const vanilla = new UintType("u32", undefined, [range(from, to)]);
const loose = new UintType("u32", true, [range(from, to)]);
const strict = new UintType("u32", false, [range(from, to)]);

const u32 = { vanilla, loose, strict };

export default u32;
