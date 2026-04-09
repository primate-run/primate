import E from "#errors";
import init from "#init";
import frontend from "@primate/core/frontend";
import type { TemplateError } from "@rcompat/error";
import type { FileRef } from "@rcompat/fs";
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

async function has(specifier: string, from: FileRef) {
  return from.join("node_modules", specifier).exists();
}

async function ensure(
  specifier: string,
  from: FileRef,
  error: () => TemplateError) {
  if (!await has(specifier, from)) throw error();
}

export default frontend({
  ...init,
  async onBuild(app, options) {
    await ensure("htmx.org", app.root, () => E.htmx_package_required());
    const templates = options.clientSideTemplates;
    const lines = [
      `import htmx from "htmx.org";`,
      "globalThis.htmx = htmx;",
    ];

    if (templates !== undefined) {
      await ensure("htmx-ext-client-side-templates", app.root,
        () => E.client_side_templates_required());
      const engine = CLIENT_SIDE_TEMPLATES[templates.engine];
      await ensure(engine.package, app.root, () => {
        throw E.template_engine_required(
          templates.engine,
          engine.package,
        );
      });

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
