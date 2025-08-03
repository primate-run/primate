import Runtime from "#Runtime";
import dedent from "@rcompat/string/dedent";
import type { Tokens } from "marked";
import { marked } from "marked";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default class Default extends Runtime {
  compile = {
    server: async (text: string) => {
      const pretransformed = await this.pretransform(text);
      const tokens = marked.lexer(pretransformed);
      const toc = tokens
        .filter(token => token.type === "heading")
        .map(token => ({
          depth: (token as Tokens.Heading).depth,
          slug: slugify((token as Tokens.Heading).text),
          text: (token as Tokens.Heading).text,
        }));

      return dedent`
        export default {
          html: ${JSON.stringify(await marked.parse(pretransformed))},
          toc: JSON.parse(${JSON.stringify(JSON.stringify(toc))}),
        };
      `;
    },
  };
}
