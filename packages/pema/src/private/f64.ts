import NumberType from "#NumberType";

const vanilla = new NumberType("f64");
const loose = new NumberType("f64", true);
const strict = new NumberType("f64", false);

const f64 = { strict, loose, vanilla };

export default f64;
