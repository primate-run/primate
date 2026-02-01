import Guides from "#view/Guides";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  return async (app, ...args) => {
    const guides = await app.root.join("guides.json").json();
    const options = { placeholders: request.get("placeholders") };

    return response.view(Guides, { guides }, options)(app, ...args);
  };
});
