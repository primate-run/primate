import type Parsed from "#Parsed";

type Infer<T extends Parsed<unknown>> = T["infer"];

export { Infer as default };
