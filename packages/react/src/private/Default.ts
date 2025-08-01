import create_root from "#create-root";
import Runtime from "#Runtime";
import react from "@rcompat/build/preset/react";
import transform from "@rcompat/build/sync/transform";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  compile = {
    client: (text: string) => ({ js: transform(text, react).code }),
    server: (text: string) => transform(text, react).code,
  };
}
