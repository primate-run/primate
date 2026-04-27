import route from "primate/route";

export default route({
  get() {
    return new URL("https://example.com/login");
  },
});
