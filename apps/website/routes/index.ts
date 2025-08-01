import route from "primate/route";
import view from "primate/view";

const example_names = ["backend", "frontend", "runtime", "i18n"];

route.get(request => {
  return async (app, ...args) => {
    const server = app.config("location.server");
    const base = app.runpath(server, request.config.root, "examples");
    const examples = Object.fromEntries(await Promise.all(example_names
      .map(async section =>
        [section, await base.join(`${section}.md.html`).text()],
      )));
    const props = { app: request.config, examples };
    const options = { placeholders: request.placeholders };

    return view("Index.svelte", props, options)(app, ...args);
  };
});
