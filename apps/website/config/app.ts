import markdown from "@primate/markdown";
import poly from "@primate/poly";
import root from "@rcompat/package/root";
import config from "primate/config";
import { createHighlighter } from "shiki";
import Priss from "../modules/Priss.ts";

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
              return `<div class="tabbed"><span class="captions">${p1.split(",").map((caption, i) => `<span${i === 0 ? " class='active'" : ""}>${caption}</span>`).join("")
                }</span><span class="tabs">${t}</span></div>`;
            });
          },
        },
        renderer: {
          code(token) {
            const [lang, rest = ""] = token.lang!.split(" ");
            const caption = [...rest.matchAll(/caption=(?<caption>.*)/ug)][0]?.groups?.caption;
            const top = caption ? `<div class="caption">${caption}</div>` : "";
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
            return `${top}${clipboard}${value}`;
          },
          heading(token) {
            const level = token.depth;
            const text = token.text;

            const name = token.text.toLowerCase().replaceAll(/[?{}%]/gu, "")
              .replace(/[^\w]+/gu, "-");
            const deeplink = `
              <a class="deeplink" href="#${name}">
                <svg class="icon" width="16" height="16">
                  <use href="#anchor" />
                </svg>
              </a>
            `;

            return `
              <h${level}>
                ${text}
                ${level !== 1 ? deeplink : ""}
              </h${level}>
              <a class="anchor" name="${name}"></a>
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

          replacement += files.map(file =>
            file.name.slice(0, -file.fullExtension.length)).join(", ");
          replacement += "\n\n";

          for (const file of files) {
            replacement += `\`\`\`${file.extension.slice(1)}\n${await file.text()}\`\`\`\n\n`;
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
                href: "/install",
                title: "Install",
              },
              {
                href: "/configure",
                title: "Configure",
              },
              {
                href: "/run",
                title: "Run",
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
            items: [
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
            })),
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
