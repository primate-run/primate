import Loose from "#Loose";
import NumberType from "#NumberType";
import f32 from "#validator/f32";

const vanilla = new NumberType("f32", [f32]);
const loose = new NumberType("f32", [f32]);
loose[Loose] = true;

const strict = new NumberType("f32", [f32]);
strict[Loose] = false;

const f32$ = { vanilla, loose, strict };

export default f32$;
