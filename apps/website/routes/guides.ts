import response from "primate/response";
import route from "primate/route";

route.get(request => {
  return async (app, ...args) => {
    const guides = await app.root.join("guides.json").json();
    const props = { app: request.config, guides };
    const options = { placeholders: request.placeholders };

    return response.view("Guides.svelte", props, options)(app, ...args);
  };
});
