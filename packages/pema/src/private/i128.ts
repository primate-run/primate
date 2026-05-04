import BigIntType from "#BigIntType";
import range from "#validator/range";

const from = -(2n ** 127n);
const to = 2n ** 127n - 1n;

const vanilla = new BigIntType("i128", undefined, [range(from, to)]);
const loose = new BigIntType("i128", true, [range(from, to)]);
const strict = new BigIntType("i128", false, [range(from, to)]);

const i128 = { vanilla, loose, strict };

export default i128;
