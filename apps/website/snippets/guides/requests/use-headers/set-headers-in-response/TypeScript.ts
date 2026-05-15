import route from "primate/route";

export default route({
  get() {
    return new Response("Hello", { headers: { "X-Custom": "value" } });
  },
});
