import app from "#app";
import Guides from "#view/Guides";
import response from "primate/response";
import route from "primate/route";

route.get(async request => {
  const guides = await app.root.join("guides.json").json();
  const options = { placeholders: request.get("placeholders") };

  return response.view(Guides, { guides }, options);
});
