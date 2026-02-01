import Index from "#view/Index";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

const example_names = ["backend", "frontend", "runtime", "i18n"];

route.get(request => {
  return async (app, ...args) => {
    const examples = Object.fromEntries(example_names
      .map(section => [
        section,
        app.loadView<Component>(`docs/home/${section}.md`).html]));
    const guides = await app.root.join("guides.json").json();
    const props = { examples, guides };
    const options = { placeholders: request.get("placeholders") };

    return response.view(Index, props, options)(app, ...args);
  };
});
