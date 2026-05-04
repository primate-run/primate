import BigIntType from "#BigIntType";
import range from "#validator/range";

const from = -(2n ** 63n);
const to = (2n ** 63n) - 1n;

const vanilla = new BigIntType("i64", undefined, [range(from, to)]);
const loose = new BigIntType("i64", true, [range(from, to)]);
const strict = new BigIntType("i64", false, [range(from, to)]);
const i64 = { vanilla, loose, strict };

export default i64;
