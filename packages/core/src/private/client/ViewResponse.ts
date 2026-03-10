import type ViewOptions from "#client/ViewOptions";
import type ResponseFunction from "#response/ResponseFunction";
import type { Dict } from "@rcompat/type";

type View = (name: string, props?: Dict, options?: ViewOptions) =>
  ResponseFunction;

export { View as default };
