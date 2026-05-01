import Loose from "#Loose";
import NumberType from "#NumberType";

const strict = new NumberType("f64");
strict[Loose] = false;

const loose = new NumberType("f64");
loose[Loose] = true;

const vanilla = new NumberType("f64");

const f64 = { strict, loose, vanilla };

export default f64;
