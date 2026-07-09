import app from "@/config/app";
import Guides from "@/views/Guides";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get() {
    const guides = await app.root.join("guides.json").json();

    return response.view(Guides, { guides });
  },
});
