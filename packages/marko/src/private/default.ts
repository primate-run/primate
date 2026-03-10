import init from "#init";
import { compileSync } from "@marko/compiler";
import frontend from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";

export default frontend({
  ...init,
  compile: {
    server: (text: string, file: FileRef) => compileSync(text, file.path).code,
    client: (text: string) => ({ js: text }),
  },
});
