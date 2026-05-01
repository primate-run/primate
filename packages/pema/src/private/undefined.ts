import Loose from "#Loose";
import UndefinedType from "#UndefinedType";

const vanilla = new UndefinedType();

const loose = new UndefinedType();
loose[Loose] = true;

const strict = new UndefinedType();
strict[Loose] = false;

const undefined_ = { vanilla, loose, strict };

export default undefined_;
