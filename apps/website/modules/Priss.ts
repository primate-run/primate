import type BuildApp from "@primate/core/BuildApp";
import location from "@primate/core/location";
import Module from "@primate/core/Module";
import type NextBuild from "@primate/core/NextBuild";
import type NextHandle from "@primate/core/NextHandle";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";
import type FileRef from "@rcompat/fs/FileRef";
import Status from "@rcompat/http/Status";
import type RequestFacade from "primate/RequestFacade";
import view from "primate/view";

const cookie = (name: string, value: string, secure: boolean) =>
  `${name}=${value};HttpOnly;Path=/;${secure};SameSite=Strict`;

const cookie_name = "color-scheme";
const blog_base = "https://primate.run/blog";

type SidebarItem = {
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
  links: Link[];
  root: FileRef;
  theme: {
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
    const entries = await app.path.components.join("content", "blog").list();
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

    return next(app);
  }

  serve(app: ServeApp, next: NextServe) {
    this.#app = app;

    return next(app);
  }

  async #page(pathname: string) {
    const app = this.app;
    const config = this.#config;

    const base = app.runpath(location.server, config.root.path);
    const html = base.join(`${pathname}.md.html`);

    if (!await html.exists()) {
      return undefined;
    }
    const toc = base.join(`${pathname}.md.json`);

    const content = (await html.text()).replace("%PATHNAME%", pathname);
    /*const sidebar = config.theme.sidebar;
    if (pathname === "/blog") {
      return { content, toc: await toc.json(), sidebar };
    }

    const positions = sidebar.map((page, i) => ({ ...page, i }));
    const headings = positions.filter(page => page.title === undefined);
    const position = positions.findIndex(page => page.link === pathname);
    const { heading } = headings.findLast(({ i }) => position > i);
    const pages = sidebar.filter(page => page.title !== undefined);
    const i = pages.findIndex(page => page.link === pathname);
    const page = {
      previous: i > 0 ? pages[i - 1] : undefined,
      next: i < pages.length - 1 ? pages[i + 1] : undefined,
      heading,
    };*/
    return {
      component: "Static.svelte",
      props: { content/*, toc: await toc.json(), sidebar, page, app: config*/ },
    };
  }

  async #blog(pathname: string) {
    const app = this.app;
    const config = this.#config;

    if (pathname.startsWith("/blog")) {
      const directory = app.root.join(config.root, "blog");
      if (await directory.exists()) {
        if (pathname === "/blog") {
          const posts = await Promise.all((await directory.collect(file =>
            /^.*json$/u.test(file.path)))
            .map(async path =>
              ({ ...await path.json<{ epoch: number }>(), link: path.base })));
          posts.sort((a, b) => b.epoch - a.epoch);
          return {
            component: "Blog.svelte",
            props: { app: config, posts },
          };
        }
        const base = pathname.slice(5);
        try {
          const meta = await directory.join(`${base}.json`).json();
          const { content/*, toc*/ } = (await this.#page(pathname))!.props;
          return {
            component: "BlogEntry.svelte",
            props: { app: config/*, toc*/, content, meta },
          };
        } catch {
          // ignore the error and let Primate show an error page
        }
      }
    }
    return undefined;
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const { cookies, headers, url: { pathname } } = request;

    const color_scheme = headers["color-scheme"];

    if (color_scheme !== undefined) {
      return new Response(null, {
        headers: {
          "set-cookie": cookie(cookie_name, color_scheme, this.app.secure),
        },
        status: Status.OK,
      });
    }

    const placeholders = {
      "color-scheme": cookies["color-scheme"] ?? "light",
    };

    const config = this.#config;
    const app = this.app;

    if (this.#config.blog) {
      const handler = await this.#blog(pathname);
      if (handler !== undefined) {
        const { component, props } = handler;
        return view(component, props, { placeholders })(app, {}, request) as Response;
      }
    }

    const page = await this.#page(pathname);
    if (page !== undefined) {
      const { component, props } = page;
      return view(component!, props, { placeholders })(app, {}, request) as Response;
    }
    return next({ ...request, config, placeholders });
  }
}
