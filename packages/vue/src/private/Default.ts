import compile from "#compile";
import create_root from "#create-root";
import Runtime from "#Runtime";

export default class Default extends Runtime {
  compile = {
    client: (text: string, _: unknown, root: boolean) => (
      { js: root ? text : compile.server(text) }
    ),
    server: (text: string) => compile.server(text),
  };
  root = {
    create: create_root,
  };
}
