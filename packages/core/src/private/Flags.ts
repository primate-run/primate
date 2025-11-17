import p from "pema";

export default p({
  mode: p.union("production", "development", "testing"),
  target: p.string.default("web"),
  dir: p.string.default("build"),
});
