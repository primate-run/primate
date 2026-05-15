import route from "primate/route";

export default route({
  get() {
    return new Response("Custom text", {
      headers: { "Content-Type": "text/custom" },
    });
  },
});
