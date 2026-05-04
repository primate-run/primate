import UintType from "#UintType";
import range from "#validator/range";

const from: number = 0;
const to: number = 2 ** 16 - 1;

const vanilla = new UintType("u16", undefined, [range(from, to)]);
const loose = new UintType("u16", true, [range(from, to)]);
const strict = new UintType("u16", false, [range(from, to)]);

const u16 = { vanilla, loose, strict };

export default u16;
