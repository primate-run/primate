import Status from "@rcompat/http/Status";
import type { BuildAppHook } from "@primate/core/hook";
import stringify from "@rcompat/record/stringify";
import view from "primate/handler/view";

const encode_title = (title: string) =>
  title.toLowerCase().replaceAll(" ", "-");

const parse_title_object = (section, entry) => entry.heading
  ? entry
  : Object.entries(entry).map(([subsection, titles]) =>
    titles.map(title =>
      ({ title, link: `/${section}/${subsection}/${encode_title(title)}` })))
    .flat();

const get_sidebar = (pathname, sidebar) => {
  const [, section] = pathname.split("/");
  return sidebar[section]
    ?.flatMap(title => typeof title === "string"
      ? { title, link: `/${section}/${encode_title(title)}` }
      : parse_title_object(section, title))
    .map(line =>
      line.link === pathname ? { ...line, current: true } : line,
    );
};

const get_page = async (env, config, pathname) => {
  const location = env.get("location");
  const base = env.runpath(location.server, config.root);
  const html = await base.join(`${pathname}.md.html`);
  if (!await html.exists()) {
    return undefined;
  }
  const toc = await base.join(`${pathname}.md.json`);

  const repo = `https://github.com/${config.theme.github}`;
  const content = (await html.text())
    .replace("%REPO%", repo)
    .replace("%PATHNAME%", pathname);
  const sidebar = get_sidebar(pathname, config.theme.sidebar);
  if (sidebar === undefined) {
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
  };
  return {
    component: "StaticPage.svelte",
    props: { content, toc: await toc.json(), sidebar, page, app: config },
  };
};

const handle_blog = async (env, config, pathname) => {
  if (pathname.startsWith("/blog")) {
    const directory = env.root.join(config.root, "blog");
    if (await directory.exists()) {
      if (pathname === "/blog") {
        const posts = await Promise.all((await directory.collect(/^.*json$/u))
          .map(async path => ({ ...await path.json(), link: path.base })));
        posts.sort((a, b) => b.epoch - a.epoch);
        return {
          component: "BlogIndex.svelte",
          props: { app: config, posts },
        };
      }
      const base = pathname.slice(5);
      try {
        const meta = await directory.join(`${base}.json`).json();
        const { content, toc } = await get_page(env, config, pathname);
        return {
          component: "BlogPage.svelte",
          props: { content, toc, meta, app: config },
        };
      } catch (error) {
        // ignore the error and let Primate show an error page
      }
    }
  }
  return undefined;
};

const cookie = (name, value, { secure }) =>
  `${name}=${value};HttpOnly;Path=/;${secure};SameSite=Strict`;
const cookie_name = "color-scheme";
const blog_base = "https://primate.run/blog";

export default config => {
  const { blog } = config;
  let env;

  return {
    name: "priss",
    init(app, next) {
      env = app;
      return next(app);
    },
    async stage(app, next) {
      const entries = await app.path.components.join("content", "blog").list();
      const jsons = (await Promise.all(entries
        .filter(({ path }) => path.endsWith(".json"))
        .map(async file => ({
          link: `${blog_base}/${file.base}`,
          description: (await file.directory.join(`${file.base}.md`).text()).split("\n\n")[0],
          ...await file.json(),
        }))))
        .toSorted((a, b) => Math.sign(b.epoch - a.epoch))
        .map(({ title, link, description }) => ({ title, link, description }))
      ;
      await app.runpath("blog").create();
      await app.runpath("blog", "entries.json").write(stringify(jsons));

      return next(app);
    },
    async handle(request, next) {
      const { url: { pathname }, headers, cookies } = request;

      const color_scheme = headers["color-scheme"];
      const options = {
        secure: env.secure,
      };

      if (color_scheme !== undefined) {
        return new Response(null, {
          status: Status.OK,
          headers: {
            "set-cookie": cookie(cookie_name, color_scheme, options),
          },
        });
      }

      const placeholders = {
        "color-scheme": cookies.get("color-scheme") ?? "light",
      };

      if (blog) {
        const handler = await handle_blog(env, config, pathname);
        if (handler !== undefined) {
          const { component, props } = handler;
          return view(component, props, { placeholders })(env, {}, request);
        }
      }

      const page = await get_page(env, config, pathname);
      if (page !== undefined) {
        const { component, props } = page;
        return view(component, props, { placeholders })(env, {}, request);
      }
      return next({ ...request, config, placeholders });
    },
  };
};
