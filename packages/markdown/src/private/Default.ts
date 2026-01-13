import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import string from "@rcompat/string";
import type { Dict } from "@rcompat/type";
import type { Tokens } from "marked";
import { marked } from "marked";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function frontmatter(src: string): { body: string; meta: Dict | null } {
  const input = src.replace(/^\uFEFF/, "");
  const match = input.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {
    body: input,
    meta: null,
  };

  const raw = match[1].trim();
  const body = input.slice(match[0].length);

  // Try JSON first
  try {
    return { body, meta: JSON.parse(raw) };
  } catch { /* fall through */ }

  // Minimal key: value parser (not YAML; single-line only)
  const meta: Dict = {};
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf(":");
    if (i < 0) continue;
    const key = s.slice(0, i).trim();
    const val = s.slice(i + 1).trim();

    // quoted strings
    if ((val.startsWith("\"") && val.endsWith("\""))
      || (val.startsWith("'") && val.endsWith("'"))) {
      meta[key] = val.slice(1, -1);
      continue;
    }
    // booleans / numbers
    if (/^(true|false)$/i.test(val)) {
      meta[key] = /^true$/i.test(val); continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(val)) {
      meta[key] = Number(val); continue;
    }
    meta[key] = val; // fallback string
  }

  return { body, meta };
};

export default class Default extends Runtime {
  compile = {
    server: async (_: string, file: FileRef) =>
      `export { default } from "markdown:${file.path}";`,
  };

  async build(app: BuildApp, next: NextBuild) {
    const { pretransform } = this;
    app.plugin("server", {
      name: "markdown",
      setup(build) {
        build.onResolve({ filter: /^markdown:/ }, ({ path }) => {
          const filePath = path.slice("markdown:".length);
          return { path: filePath, namespace: "markdown" };
        });

        build.onLoad({ filter: /.*/, namespace: "markdown" }, async args => {
          const text = await fs.text(args.path);
          const { body, meta } = frontmatter(await pretransform(text));
          const tokens = marked.lexer(body);
          const toc = tokens
            .filter(token => token.type === "heading")
            .map(token => ({
              depth: (token as Tokens.Heading).depth,
              slug: slugify((token as Tokens.Heading).text),
              text: (token as Tokens.Heading).text,
            }));

          return {
            contents: string.dedent`
              export default {
                md: ${JSON.stringify(body)},
                html: ${JSON.stringify(await marked.parse(body))},
                toc: JSON.parse(${JSON.stringify(JSON.stringify(toc))}),
                meta: ${meta ? JSON.stringify(meta) : "null"},
              };
            `,
            loader: "js",
            watchFiles: [args.path],
          };
        });
      },
    });

    return super.build(app, next);
  }
}

