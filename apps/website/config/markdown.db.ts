import options from "#config/markdown.options";
import markdown from "@primate/markdown";

export default markdown({
  driver: "file",
  directory: "docs",
  ...options,
});
