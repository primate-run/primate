import init from "#init";
import frontend from "@primate/core/frontend";
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
  if (match === null) return {
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

function toc(body: string) {
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

export default frontend({
  ...init,
  schema: init.schema,
  onBuild(app, options) {
    const pretransform = options.pretransform ?? ((m: string) => m);

    if (options.marked !== undefined) {
      const renderer = { ...options.marked.renderer ?? {} };
      marked.use({ ...options.marked, renderer });
    }

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
          return {
            contents: string.dedent`
              export default {
                md: ${JSON.stringify(body)},
                html: ${JSON.stringify(await marked.parse(body))},
                toc: JSON.parse(${JSON.stringify(JSON.stringify(toc(body)))}),
                meta: ${meta !== null ? JSON.stringify(meta) : "null"},
              };
            `,
            loader: "js",
            watchFiles: [args.path],
          };
        });
      },
    });
  },
  compile: {
    server: async (_: string, file: FileRef) =>
      `export { default } from "markdown:${file.path}";`,
  },
});
