import fs from "@rcompat/fs";
import http from "@rcompat/http";
import type { Module } from "primate";

const cookie = (name: string, value: string, secure: boolean) =>
  `${name}=${value};HttpOnly;Path=/;${secure};SameSite=Strict`;

const cookie_name = "color-scheme";

const website: () => Module = () => {
  let secure = false;

  return {
    name: "primate-website",

    setup({ onBuild, onServe, onHandle }) {
      onBuild(async app => {
        app.plugin("client", {
          name: "static-loader",
          setup(build) {
            build.onLoad({ filter: /\.woff2$/ }, async args => {
              return {
                contents: await fs.bytes(args.path),
                loader: "file",
              };
            });
          },
        });
        const views = app.path.views;

        // collect guide categories and names
        const base = views.join("docs", "guides");
        const guides = await base.files({
          recursive: true,
          filter: info => info.type === "file",
        });
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

      });

      onServe(app => {
        secure = app.secure;
      });

      onHandle((request, next) => {
        const { cookies, headers } = request;

        const color_scheme = headers.try("Color-Scheme");

        if (color_scheme !== undefined) {
          return new Response(null, {
            headers: {
              "set-cookie": cookie(cookie_name, color_scheme, secure),
            },
            status: http.Status.OK,
          });
        }

        const scheme = cookies.try(cookie_name) ?? "light";

        const placeholders = {
          "color-scheme": scheme,
          "theme-color": scheme === "dark" ? "#1b1b1b" : "#ffffff",
        };

        return next(request.set("placeholders", placeholders));
      });
    },
  };
};

export default website;
