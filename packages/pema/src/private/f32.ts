import NumberType from "#NumberType";
import f32 from "#validator/f32";

const vanilla = new NumberType("f32", undefined, [f32]);
const strict = new NumberType("f32", false, [f32]);
const loose = new NumberType("f32", true, [f32]);

const f32$ = { vanilla, loose, strict };

export default f32$;
