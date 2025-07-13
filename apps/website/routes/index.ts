import view from "primate/handler/view";
import route from "primate/route";

const example_names = ["backend", "frontend", "runtime", "i18n"];

export default route({
  get(request) {
    return async (app, ...args) => {
      const server = app.config("location.server");
      const base = app.runpath(server, request.config.root, "examples");
      const examples = Object.fromEntries(await Promise.all(example_names
          .map(async section =>
            [section, await base.join(`${section}.md.html`).text()],
      )));
      const props = { app: request.config, examples };
      const options = { placeholders: request.placeholders };

      return view("Homepage.svelte", props, options)(app, ...args);
    };
  },
});
