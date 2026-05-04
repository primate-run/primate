import FunctionType from "#FunctionType";

/**
 * Value is a function.
 */
const vanilla = new FunctionType();
const loose = new FunctionType();
const strict = new FunctionType();

const function$ = { vanilla, loose, strict };

export default function$;
