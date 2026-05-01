import DateType from "#DateType";
import Loose from "#Loose";

const vanilla = new DateType();

const loose = new DateType();
loose[Loose] = true;

const strict = new DateType();
strict[Loose] = false;

const date = { vanilla, loose, strict };

export default date;
