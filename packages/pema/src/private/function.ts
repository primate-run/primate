import FunctionType from "#FunctionType";
import Loose from "#Loose";

/**
 * Value is a function.
 */
const vanilla = new FunctionType();

const loose = new FunctionType();
loose[Loose] = true;

const strict = new FunctionType();
strict[Loose] = false;

const function$ = { vanilla, loose, strict };

export default function$;
