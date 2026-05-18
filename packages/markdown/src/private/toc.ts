import slugify from "#slugify";
import type { Tokens } from "marked";
import { marked } from "marked";

export default function toc(body: string) {
  return marked
    .lexer(body)
    .filter(token => token.type === "heading")
    .map(token => {
      const heading = token as Tokens.Heading;
      return {
        depth: heading.depth,
        slug: slugify(heading.text),
        text: heading.text,
      };
    });
}
