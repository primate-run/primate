import Loose from "#Loose";
import UnknownType from "#UnknownType";

/**
* Value is an unknown type.
*/

const vanilla = new UnknownType();

const loose = new UnknownType();
loose[Loose] = true;

const strict = new UnknownType();
strict[Loose] = false;

const unknown = { vanilla, loose, strict };

export default unknown;
