import BigIntType from "#BigIntType";
import Loose from "#Loose";
import range from "#validator/range";

const from = -(2n ** 127n);
const to = 2n ** 127n - 1n;

const vanilla = new BigIntType("i128", [range(from, to)]);

const loose = new BigIntType("i128", [range(from, to)]);
loose[Loose] = true;

const strict = new BigIntType("i128", [range(from, to)]);
strict[Loose] = false;

const i128 = { vanilla, loose, strict };

export default i128;
