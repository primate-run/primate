import BigUintType from "#BigUintType";
import range from "#validator/range";

const from: bigint = 0n;
const to: bigint = 2n ** 128n - 1n;

const vanilla = new BigUintType("u128", undefined, [range(from, to)]);
const loose = new BigUintType("u128", true, [range(from, to)]);
const strict = new BigUintType("u128", false, [range(from, to)]);

const u128 = { vanilla, loose, strict };

export default u128;
