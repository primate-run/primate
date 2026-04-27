import route from "primate/route";

export default route({
  get() {
    return { foo: "bar", bar: 1 };
  },
});
