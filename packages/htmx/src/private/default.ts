import init from "#init";
import frontend from "@primate/core/frontend";
import string from "@rcompat/string";

const CLIENT_SIDE_TEMPLATES = {
  mustache: {
    package: "mustache",
    global: "Mustache",
  },
  handlebars: {
    package: "handlebars",
    global: "Handlebars",
  },
  nunjucks: {
    package: "nunjucks",
    global: "nunjucks",
  },
} as const;

function server(text: string) {
  return string.dedent`
    import render from "@primate/htmx/render";
    export default props => render(${JSON.stringify(text)}, props);`;
}

export default frontend({
  ...init,
  onBuild(app, options) {
    const templates = options.clientSideTemplates;
    const lines = [
      `import htmx from "htmx.org";`,
      "globalThis.htmx = htmx;",
    ];

    if (templates !== undefined) {
      const engine = CLIENT_SIDE_TEMPLATES[templates.engine];

      lines.push(
        `import ${engine.global} from "${engine.package}";`,
        `globalThis.${engine.global} = ${engine.global};`,
        `import "htmx-ext-client-side-templates";`,
      );
    }
    app.entrypoint(lines.join("\n"));
  },
  compile: {
    server,
  },
});
