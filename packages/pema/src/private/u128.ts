import BigUintType from "#BigUintType";
import Loose from "#Loose";
import range from "#validator/range";

const from: bigint = 0n;
const to: bigint = 2n ** 128n - 1n;

const vanilla = new BigUintType("u128", [range(from, to)]);

const loose = new BigUintType("u128", [range(from, to)]);
loose[Loose] = true;

const strict = new BigUintType("u128", [range(from, to)]);
strict[Loose] = false;

const u128 = { vanilla, loose, strict };

export default u128;
