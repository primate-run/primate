import build from "@primate/core/build";
import type Mode from "@primate/core/Mode";

const T_FLAG = "--target=";

// build for production
export default (flags: string[], mode: Mode = "production") => {
  const target = flags.find(f => f.startsWith(T_FLAG))?.slice(T_FLAG.length)
    ?? "web";
  return build(mode, target);
};
