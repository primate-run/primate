// routes/index.ts
import route from "primate/route";
import response from "primate/response";

export default route({
  get() {
    return response.view("Welcome.eta", { name: "World" });
  },
});
