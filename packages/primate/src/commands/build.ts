import build from "@primate/core/build";
import type Flags from "@primate/core/Flags";
import type Mode from "@primate/core/Mode";
import get_flag from "./get-flag.js";

// build for production
export default function app(flags: string[], mode: Mode = "production") {
  const build_flags: typeof Flags.input = {
    mode: mode,
    target: get_flag(flags, "target"),
    dir: get_flag(flags, "dir"),
  };
  return build(build_flags);
};
