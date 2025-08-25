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

export default class PrissModule extends Module {
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
    const components = app.path.components;
    const entries = await components.join("content", "blog").list();
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
    const base = components.join("content", "guides");
    const guides = await components.join("content", "guides").collect();
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
}
