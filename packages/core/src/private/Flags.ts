import { Schema as log } from "#logger";
import p from "pema";

export default p({
  mode: p.union("production", "development", "testing").default("production"),
  target: p.string.default("web"),
  outdir: p.string.default("build"),
  log,
});
