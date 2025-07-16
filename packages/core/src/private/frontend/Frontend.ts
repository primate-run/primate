import type Options from "#frontend/Options";
import type ResponseFunction from "#ResponseFunction";
import type Dict from "@rcompat/type/Dict";

type Frontend = (name: string, props?: Dict, options?: Options) =>
ResponseFunction;

export { Frontend as default };
