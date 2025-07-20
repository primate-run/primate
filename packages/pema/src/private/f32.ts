import NumberType from "#NumberType";
import f32 from "#validator/f32";

export default new NumberType<"f32">("f32", [f32]);
