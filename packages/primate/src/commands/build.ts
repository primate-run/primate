import type { Mode } from "@primate/core";
import build from "@primate/core/build";
import type Flags from "@primate/core/Flags";
import fs from "@rcompat/fs";
import get_flag from "./get-flag.js";

// build for production
export default async function app(flags: string[], mode: Mode = "production") {
  const root = await fs.project.root();
  const build_flags: typeof Flags.input = {
    mode: mode,
    target: get_flag(flags, "target"),
    dir: get_flag(flags, "dir"),
  };
  return build(root, build_flags);
};
