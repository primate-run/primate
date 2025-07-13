import create_root from "#create-root";
import Runtime from "#Runtime";
import angular from "@rcompat/build/preset/angular";
import transform from "@rcompat/build/sync/transform";

export default class Angular extends Runtime {
  compile = {
    server: (text: string) => transform(text, angular).code,
    client: (text: string) => ({ js: transform(text, angular).code, css: null }),
  };
  root = {
    create: create_root,
  };
}
