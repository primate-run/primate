import app from "#app";
import type { Component } from "@primate/markdown";
import route from "primate/route";

const base = "https://primate.run";

export default route({
  get() {
    const names = app.views.entries().map(view =>
      [view[0].slice("docs/".length), (view[1] as Component).meta?.title]) as
      [string, Component][];
    const docs = names
      .filter(name => name[0].startsWith("docs"))
      .map(name => `- [${name[1]}](${base}/${name[0]}.md)`)
      .join("\n")
      ;
    const guides = names
      .filter(name => name[0].startsWith("guides"))
      .map(name => `- [${name[1]}](${base}/${name[0]}.md)`)
      .join("\n")
      ;

    return `# Primate

## Docs

${docs}

## Guides

${guides}`;
  },
});
