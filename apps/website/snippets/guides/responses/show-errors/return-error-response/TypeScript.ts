import response from "primate/response";

export default route({
  get() {
    return response.json({ error: "Bad request" }, { status: 400 });
  },
});
