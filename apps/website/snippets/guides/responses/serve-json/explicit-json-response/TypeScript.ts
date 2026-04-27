import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.json({ error: "Not found" }, { status: 404 });
  },
});
