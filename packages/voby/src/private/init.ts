import type { Init } from "@primate/core/frontend";

const module: Init = {
  name: "voby",
  extensions: [".tsx", ".jsx"],
  layouts: false,
  client: false,
  onBuild(app) {
    app.plugin("server", {
      name: "voby/server/external",
      setup(build) {
        build.onResolve({ filter: /^linkedom-global$/ }, () => ({
          external: true,
        }));
      },
    });
  },
};

export default module;
