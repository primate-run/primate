import BooleanType from "#BooleanType";
import Loose from "#Loose";

const vanilla = new BooleanType();

const loose = new BooleanType();
loose[Loose] = true;

const strict = new BooleanType();
strict[Loose] = false;

const boolean = { vanilla, loose, strict };

export default boolean;
