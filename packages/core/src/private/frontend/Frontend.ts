import type Options from "#frontend/Options";
import type Props from "#frontend/Props";
import type ResponseFunction from "#ResponseFunction";

type Frontend = (name: string, props?: Props, options?: Options) =>
  ResponseFunction;

export { Frontend as default };
