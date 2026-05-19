import app from "#app";
import type { Component } from "@primate/markdown";
import route from "primate/route";

const base = "https://primate.run";

export default route({
  async get() {
    return app.views.entries()
      .filter(name => name[0].startsWith("docs/docs")
        || name[0].startsWith("docs/guides"))
      .map(view => {
        const source = `${base}/${view[0].slice("docs/".length)}`;
        return `Source: ${source}${(view[1] as Component).md}`;
      }).join("\n\n\n");
  },
});
