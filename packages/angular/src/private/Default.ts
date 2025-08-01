import create_root from "#create-root";
import Runtime from "#Runtime";
import angular from "@rcompat/build/preset/angular";
import transform from "@rcompat/build/sync/transform";

export default class Default extends Runtime {
  compile = {
    client: (text: string) => ({ js: transform(text, angular).code }),
    server: (text: string) => transform(text, angular).code,
  };
  root = {
    create: create_root,
  };
}
