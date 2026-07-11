import type { Module } from "primate";

const website: Module = {
  name: "primate-website",

  setup({ onBuild }) {
    onBuild(async app => {
      const views = app.path.views;

      // collect guide categories and names
      const base = views.join("docs", "guides");
      const guides = await base.files({
        recursive: true,
        filter: info => info.type === "file",
      });
      const categories = new Map<string, { name: string; path: string }[]>;
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
  },
};

export default website;
