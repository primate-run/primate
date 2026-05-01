import Loose from "#Loose";
import StringType from "#StringType";

const vanilla = new StringType();

const loose = new StringType();
loose[Loose] = true;

const strict = new StringType();
strict[Loose] = false;

const string = { vanilla, loose, strict };

export default string;
