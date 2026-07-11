import app from "@/config/app";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get() {
    return response.page({ guides: await app.root.join("guides.json").json() });
  },
});
