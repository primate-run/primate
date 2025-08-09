import type Component from "@primate/markdown/Component";
import route from "primate/route";
import view from "primate/view";

const example_names = ["backend", "frontend", "runtime", "i18n"];

route.get(request => {
  return async (app, ...args) => {
    const examples = Object.fromEntries(example_names
      .map(section => [
        section,
        app.component<Component>(`content/home/${section}.md`).html]));
    const props = { app: request.config, examples };
    const options = { placeholders: request.placeholders };

    return view("Index.svelte", props, options)(app, ...args);
  };
});
