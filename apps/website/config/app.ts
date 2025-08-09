import markdown from "@primate/markdown";
import poly from "@primate/poly";
import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/package/root";
import config from "primate/config";
import type { SpecialLanguage } from "shiki";
import { createHighlighter } from "shiki";
import Priss from "../modules/Priss.ts";

const grain = await FileRef.join(import.meta.dirname, "grain.json")
  .json<SpecialLanguage>();

const highlighter = await createHighlighter({
  langs: [
    // backend
    "javascript",
    "typescript",
    "go",
    "python",
    "ruby",
    "rust",
    // frontend
    "jsx",
    "svelte",
    "vue",
    "angular-ts",
    "html",
    "handlebars",
    "markdown",
    "marko",
    // other
    "shell",
    "json",
    "http",
  ],
  themes: ["nord"],
});

await highlighter.loadLanguage({ ...grain, aliases: ["gr"] });

function make_captions(captionline: string) {
  const captions = captionline.split(",").map(p => p.split(":")[0]);
  const filenames = captionline.split(",").map(p => p.split(":")[1]);

  const filename_block = filenames[0] !== undefined
    ? `<span class="filenames">${filenames.map((filename, i) =>
      `<span${i === 0 ? " class='active'" : ""}>${filename}</span>`)
      .join("")}</span>`
    : "";

  return `<span class="captionline">
    <span class="captions">${captions.map((caption, i) =>
    `<span${i === 0 ? " class='active'" : ""}>${caption}</span>`)
      .join("")
    }</span>${filename_block}</span>`;
}

export default config({
  build: {
    options: {
      loader: {
        ".woff2": "file",
      },
    },
  },
  modules: [
    markdown({
      marked: {
        hooks: {
          postprocess(html) {
            return html.replaceAll(/!!!\n(.*?)\n!!!/gus, (_, p1) =>
              `<div class="box">${p1}</div>`).replaceAll(" -- ", " – ");
          },
          preprocess(html) {
            return html.replaceAll(/%%%(.*?)\n(.*?)%%%/gus, (_, p1, p2) => {
              const t = (p2 as string)
                .split("\n```")
                .filter((p) => p !== "" && !p.startsWith("\n"))
                .map((p, i) => `<div${i === 0 ? "" : " class='hidden'"}>

\`\`\`${p}
\`\`\`

</div>`).join("");
              return `<div class="tabbed">${make_captions(p1)}<span class="tabs">${t}</span></div>`;
            });
          },
        },
        renderer: {
          code(token) {
            const [lang, rest = ""] = token.lang!.split(" ");
            const value = highlighter.codeToHtml(token.text, {
              lang,
              themes: {
                dark: "nord",
                light: "nord",
              },
            });
            const clipboard = `
              <div class="to-clipboard">
                <svg class="copy" width="16" height="16">
                  <use href="#copy" />
                </svg>
                <svg class="check" width="16" height="16">
                  <use href="#check" />
                </svg>
              </div>

            `;
            return `${clipboard}${value}`;
          },
          heading(token) {
            const level = token.depth;
            const text = token.text;

            const name = token.text.toLowerCase().replaceAll(/[?{}%]/gu, "")
              .replace(/[^\w]+/gu, "-");
            const deeplink = `
              <a class="deeplink" id="${name}" href="#${name}">
                <svg class="icon" width="16" height="16">
                  <use href="#hash" />
                </svg>
              </a>
            `;

            return `
              <h${level}>
                <a name="${name}"></a>
                ${text}
                ${level !== 1 ? deeplink : ""}
              </h${level}>
            `;
          },
        },
      },
      async pretransform(text: string) {
        const externals = /\[s=([^\]]+)\]/g;
        const replacements = [];

        let match;
        while ((match = externals.exec(text)) !== null) {
          const [fullMatch, folder] = match;
          replacements.push({ folder, fullMatch });
        }

        if (replacements.length === 0) {
          return text;
        }

        let replaced = text;

        let replacement = "";

        for (const { folder, fullMatch } of replacements) {
          replacement = "%%% ";

          const files = await (await root()).join("snippets", folder).list();
          const [filenamer] = files.filter(file => file.name === "filename.ts");
          const has_filename = filenamer !== undefined;
          const to_filename = has_filename ? await filenamer.import("default") : () => "";

          const snippets = files.filter(file => file.name !== "filename.ts");

          replacement += snippets
            .map(file =>
              file.name.slice(0, -file.fullExtension.length)
              + (has_filename ? `:${to_filename(file.fullExtension)}` : ""),
            ).join(", ");
          replacement += "\n\n";

          const is_sh = (file: FileRef) => file.extension === ".sh" ? "$ " : "";

          for (const file of snippets) {
            replacement += `\`\`\`${file.extension.slice(1)}\n${is_sh(file)}${await file.text()}\`\`\`\n\n`;
          }

          replacement += "\n%%%";

          replaced = replaced.replace(fullMatch, replacement);
        }

        return replaced;
      },
    }),
    poly({ extension: ".svelte" }),
    new Priss({
      blog: true,
      description: "The universal web framework",
      theme: {
        links: [
          { href: "/chat", icon: "chat" },
          { href: "https://x.com/primate_run", icon: "x" },
          { href: "https://github.com/primate-run/primate", icon: "github" },
        ],
        navbar: [
          { label: "Docs", link: "/docs" },
          { label: "Blog", link: "/blog" },
        ],
        sidebar: [
          {
            items: [
              {
                href: "/",
                title: "What is Primate?",
              },
              {
                href: "/quickstart",
                title: "Quickstart",
              },
              {
                href: "/setup",
                title: "Project setup",
              },
            ],
            title: "Intro",
          },
          {
            items: [
              {
                href: "/routes",
                items: [
                  {
                    href: "/hierarchy",
                    title: "Hierarchy",
                  },
                  {
                    href: "/functions",
                    title: "Functions",
                  },
                  {
                    href: "/responses",
                    title: "Responses",
                  },
                  {
                    href: "/sessions",
                    title: "Sessions",
                  },
                  {
                    href: "/layouts",
                    title: "Layouts",
                  },
                  {
                    href: "/guards",
                    title: "Guards",
                  },
                  {
                    href: "/errors",
                    title: "Errors",
                  },
                ],
                title: "Routes",
              },
              {
                href: "/components",
                items: [
                  /* ... */
                  {
                    href: "/i18n",
                    title: "I18N",
                  },
                ],
                title: "Components",
              },
              {
                href: "/validation",
                title: "Validation",
              },
              {
                href: "/stores",
                items: [
                  /* ... */
                  {
                    href: "/database",
                    title: "Database stores",
                  },
                  {
                    href: "/api",
                    title: "API",
                  },
                  {
                    href: "/derived",
                    title: "Derived",
                  },
                ],
                title: "Stores",
              },
            ],
            title: "Framework",
          },
          {
            items: [{
              href: "/frontend",
              title: "Overview",
            }].concat(...[
              "Angular",
              "Eta",
              "Handlebars",
              "HTML",
              "HTMX",
              "Markdown",
              "Marko",
              "Poly",
              "React",
              "Solid",
              "Svelte",
              "Voby",
              "Vue",
              "Web Components",
            ].toSorted().map(title => ({
              href: `/frontend/${title.replaceAll(" ", "-").toLowerCase()}`,
              title,
            }))),
            title: "Frontends",
          },
          {
            href: "/backends",
            items: [
              "Go",
              "Grain",
              "Python",
              "Ruby",
            ].toSorted().map(title => ({
              href: `/backend/${title.replaceAll(" ", "-").toLowerCase()}`,
              title,
            })),
            title: "Backends",
          },
          {
            href: "/databases",
            items: [
              "MongoDB",
              "MySQL",
              "PostgreSQL",
              "SQLite",
              "SurrealDB",
            ].toSorted().map(title => ({
              href: `/database/${title.replaceAll(" ", "-").toLowerCase()}`,
              title,
            })),
            title: "Databases",
          },
          {
            href: "targets",
            items: [
              {
                href: "/target/web",
                title: "Web",
              },
              {
                title: "Cloud",
                upcoming: true,
              },
              {
                href: "/target/native",
                title: "Native",
              },
            ],
            title: "Targets",
          },
        ],
      },
      title: "Primate",
    })],
});
