import { Schema as log } from "#logger";
import runtime from "@rcompat/runtime";
import p from "pema";

export default p({
  mode: p.union("production", "development", "testing").default("production"),
  target: p.string.default(runtime.name),
  outdir: p.string.default("build"),
  log,
});
