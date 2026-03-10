import init from "#init";
import frontend from "@primate/core/frontend";
import is from "@rcompat/is";
import string from "@rcompat/string";

const htmx_esm = "htmx-esm";

function server(text: string) {
  return string.dedent`
    import render from "@primate/htmx/render";

    export default props => render(${JSON.stringify(text)}, props);`;
}

export default frontend({
  ...init,
  onBuild(app, { htmxExtensions, templates }) {
    app.entrypoint(`export { default as htmx } from "${htmx_esm}";`);

    htmxExtensions.forEach(extension => {
      app.entrypoint(`
        export * from "${htmx_esm}/${extension}";
      `);
    });

    const has_templates = htmxExtensions.includes("client-side-templates")
      && !is.empty(templates);

    if (has_templates) {
      templates
        .filter(template => template !== "xslt")
        .forEach(template => {
          app.entrypoint(`export * from "${htmx_esm}/templates/${template}";`);
        });
    }
  },
  compile: {
    server,
  },
});
