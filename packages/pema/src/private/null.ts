import Loose from "#Loose";
import NullType from "#NullType";

const vanilla = new NullType();

const loose = new NullType();
loose[Loose] = true;

const strict = new NullType();
strict[Loose] = false;

const null_ = { vanilla, loose, strict };

export default null_;
