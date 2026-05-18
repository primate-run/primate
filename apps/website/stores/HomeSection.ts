import db from "#config/markdown.db";
import markdown from "@primate/markdown";
import p from "pema";

export default markdown.store({
  db,
  directory: "home",
  frontmatter: p.loose({}),
});
