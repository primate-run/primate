import compile from "#compile";
import create_root from "#create-root";
import init from "#init";
import frontend from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  compile: {
    client: (text: string, _: unknown, root: boolean) => (
      { js: root ? text : compile.server(text) }
    ),
    server: (text: string, file: FileRef) =>
      file.path.startsWith("root:") ? text : compile.server(text),
  },
});
