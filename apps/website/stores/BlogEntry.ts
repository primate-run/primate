import db from "#config/markdown.db";
import markdown from "@primate/markdown";
import p from "pema";

export default markdown.store({
  db,
  directory: "blog",
  frontmatter: p.loose({
    title: p.string,
    epoch: p.number,
    author: p.string,
    published: p.boolean.default(false),
  }),
});
