import route from "primate/route";

export default route({
  get() {
    return { foo: "bar" };
  },
  head() {
    return new Response(null, { headers: { "x-custom": "bespoke" } });
  },
});
