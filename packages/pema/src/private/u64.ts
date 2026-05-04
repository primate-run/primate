import BigUintType from "#BigUintType";
import range from "#validator/range";

const from: bigint = 0n;
const to: bigint = 2n ** 64n - 1n;

const vanilla = new BigUintType("u64", undefined, [range(from, to)]);
const loose = new BigUintType("u64", true, [range(from, to)]);
const strict = new BigUintType("u64", false, [range(from, to)]);

const u64 = { vanilla, loose, strict };

export default u64;
