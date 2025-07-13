import BuildModule from "@primate/core/frontend/BuildModule";
import react from "@rcompat/build/preset/react";
import transform from "@rcompat/build/sync/transform";
import create_root from "#client/create-root";

export default class BuildReact extends BuildModule {
  name = "react";
  defaultExtension = ".jsx";
  root = {
    filter: /^root:react/,
    create: create_root,
  };
  compile = {
    server: (text: string) => transform(text, react).code,
    client: (text: string) => ({ js: transform(text, react).code }),
  };
}
