import markdown from "@primate/markdown";
import poly from "@primate/poly";
import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/package/root";
import config from "primate/config";
import type { SpecialLanguage } from "shiki";
import { createHighlighter } from "shiki";
import type BuildApp from "@primate/core/BuildApp";
import Module from "@primate/core/Module";
import type NextBuild from "@primate/core/NextBuild";
import type NextHandle from "@primate/core/NextHandle";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";
import Status from "@rcompat/http/Status";
import type RequestFacade from "primate/RequestFacade";

const cookie = (name: string, value: string, secure: boolean) =>
  `${name}=${value};HttpOnly;Path=/;${secure};SameSite=Strict`;

const cookie_name = "color-scheme";
const blog_base = "https://primate.run/blog";

type SidebarItem = {
  active?: true;
  href?: string;
  items?: SidebarItem[];
  title: string;
  upcoming?: true;
};

type Sidebar = SidebarItem[];

type Link = {
  href: string;
  icon: string;
};

type Config = {
  blog: boolean;
  description: string;
  theme: {
    links: Link[];
    navbar: { label: string; link: string }[];
    sidebar: Sidebar;
  };
  title: string;
};

const Priss = class extends Module {
  #app?: ServeApp;
  #config: Config;

  get name() {
    return "priss";
  }

  get app() {
    return this.#app!;
  }

  constructor(config: Config) {
    super();

    this.#config = config;
  }

  async build(app: BuildApp, next: NextBuild) {
    const views = app.path.views;
    const entries = await views.join("content", "blog").list();
    const jsons = (await Promise.all(entries
      .filter(({ path }) => path.endsWith(".json"))
      .map(async file => ({
        description: (await file.directory.join(`${file.base}.md`).text())
          .split("\n\n")[0],
        link: `${blog_base}/${file.base}`,
        ...(await file.json<{ epoch: number; title: string }>()),
      }))))
      .toSorted((a, b) => Math.sign(b.epoch - a.epoch))
      .map(({ description, link, title }) => ({ description, link, title }))
      ;
    await app.runpath("blog").create();
    await app.runpath("blog", "entries.json").writeJSON(jsons);

    // collect guide categories and names
    const base = views.join("content", "guides");
    const guides = await views.join("content", "guides").collect();
    const categories = new Map<string, { name: string; path: string }[]>();
    for (const guide of guides) {
      const name = ((await guide.text()).split("\n")[1].slice("name: ".length));
      const [category, path] = guide.debase(base).path.slice(1).split("/");

      categories.set(category, (categories.get(category) ?? []).concat({
        name,
        path: path.slice(0, -".md".length),
      }));
    }

    await app.runpath("guides.json").writeJSON([...categories.entries()]);

    return next(app);
  }

  serve(app: ServeApp, next: NextServe) {
    this.#app = app;

    return next(app);
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const { cookies, headers } = request;

    const color_scheme = headers.try("Color-Scheme");

    if (color_scheme !== undefined) {
      return new Response(null, {
        headers: {
          "set-cookie": cookie(cookie_name, color_scheme, this.app.secure),
        },
        status: Status.OK,
      });
    }

    const scheme = cookies.try(cookie_name) ?? "light";

    const placeholders = {
      "color-scheme": scheme,
      "theme-color": scheme === "dark" ? "#1b1b1b" : "#ffffff",
    };

    return next({ ...request, config: this.#config, placeholders });
  }
};
const sorting = [
  // package managers
  "npm",
  "pnpm",
  "Yarn",
  // runtime
  "Node",
  "Deno",
  "Bun",
  // frontend
  "React",
  "Angular",
  "Vue",
  "Svelte",
  "Solid",
  // backend
  "TypeScript",
  "JavaScript",
  "Go",
  "Python",
  "Ruby",
  "Grain",
  // database
  "SQLite",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "SurrealDB",
  // general
  "Store",
  "Route",
  "Component",
];

const grain = await FileRef.join(import.meta.dirname, "grain.js")
  .json<SpecialLanguage>();

function trim(filename: string) {
  return /^\d-/.test(filename) ? filename.slice(2) : filename;
}

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
    "css",
  ],
  themes: ["plastic", "vesper", "nord", "min-dark", "min-light", "catppuccin-frappe"],
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

const toIcon = (id: string) =>
  `<svg class="icon" width="16" height="16"><use href="#${id}"></use></svg>`;

export default config({
  http: {
    host: "0.0.0.0",
  },
  build: {
    loader: {
      ".woff2": "file",
    },
  },
  modules: [
    markdown({
      marked: {
        hooks: {
          postprocess(html) {
            return html.replaceAll(
              /!!!\s*([a-zA-Z0-9_-]+)?\n([\s\S]*?)\n!!!/g,
              (_, icon, content) => {
                const iconHtml = icon
                  ? toIcon(icon)
                  : "";
                return `<div class="box">${iconHtml}${content.trim()}</div>`;
              },
            )
              .replaceAll("✓", toIcon("check"))
              .replaceAll("✗", toIcon("x2"))
              ;
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

            const name = token.text.toLowerCase()
              .replaceAll(/[?{}%`]/gu, "")
              .replace(/[^\w]+/gu, "-")
              .replace(/^-+|-+$/g, "")
              ;

            const deeplink = `
              <a class="deeplink" href="#${name}">
                <svg class="icon" width="16" height="16">
                  <use href="#hash" />
                </svg>
              </a>
            `;

            return `
              <h${level} id="${name}">
                ${text.replace(/`([^`]+)`/g, "<code>$1</code>")}
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
          const files = await (await root()).join("snippets", folder).list();
          const has_tabs = files.length > 1;

          if (has_tabs) {
            replacement = "%%% ";
          } else {
            replacement = "";
          }

          const [filenamer] = files.filter(file => file.name === "filename.ts");
          const has_filename = filenamer !== undefined;
          const to_filename = has_filename ? await filenamer.import("default") : () => "";

          const snippets = files
            .filter(file => file.name !== "filename.ts")
            .toSorted((a, b) =>
              sorting.indexOf(a.core) < sorting.indexOf(b.core) ? -1 : 1);

          if (has_tabs) {
            replacement += snippets
              .map(file =>
                trim(file.name.slice(0, -file.fullExtension.length))
                + (has_filename ? `:${to_filename(file)}` : ""),
              ).join(", ");
            replacement += "\n\n";
          }

          const is_sh = (file: FileRef) => file.extension === ".sh" ? "$ " : "";

          for (const file of snippets) {
            if (!has_tabs) {
              replacement += "\n\n";
            }
            replacement += `\`\`\`${file.extension.slice(1)}\n${is_sh(file)}${await file.text()}\`\`\`\n\n`;
          }

          if (has_tabs) {
            replacement += "\n%%%";
          }

          replaced = replaced.replace(fullMatch, replacement);
        }

        return replaced;
      },
    }),
    poly(),
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
          { label: "Guides", link: "/guides" },
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
                href: "/project-structure",
                title: "Project Structure",
              },
              {
                href: "/configuration",
                title: "Configuration",
              },
            ],
            title: "Intro",
          },
          {
            items: [
              {
                href: "/routing",
                title: "Routing",
              },
              {
                href: "/requests",
                title: "Requests",
              },
              {
                href: "/responses",
                title: "Responses",
              },
              {
                href: "/views",
                title: "Views",
              },
              {
                href: "/validation",
                title: "Validation",
              },
              {
                href: "/sessions",
                title: "Sessions",
              },
              {
                href: "/stores",
                title: "Stores",
              },
              {
                href: "/i18n",
                title: "I18N",
              },
            ],
            title: "Framework",
          },
          {
            items: [{
              href: "/frontend",
              title: "Intro",
            }].concat(...[
              "Angular",
              "Eta",
              "Handlebars",
              "HTML",
              "HTMX",
              "Markdown",
              "Marko",
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
            items: [{
              href: "/backend",
              title: "Intro",
            }].concat(...[
              "Go",
              "Grain",
              "Python",
              "Ruby",
            ].toSorted().map(title => ({
              href: `/backend/${title.replaceAll(" ", "-").toLowerCase()}`,
              title,
            }))),
            title: "Backends",
          },
          {
            items: [{
              href: "/database",
              title: "Intro",
            }].concat(...[
              "MongoDB",
              "MySQL",
              "PostgreSQL",
              "SQLite",
              "SurrealDB",
            ].toSorted().map(title => ({
              href: `/database/${title.replaceAll(" ", "-").toLowerCase()}`,
              title,
            }))),
            title: "Databases",
          },
          {
            href: "/platform",
            items: [
              {
                href: "/platform",
                title: "Intro",
              },
              {
                href: "/target/web",
                title: "Web",
              },
              {
                href: "/target/native",
                title: "Native",
              },
            ],
            title: "Platforms",
          },
        ],
      },
      title: "Primate",
    })],
});
