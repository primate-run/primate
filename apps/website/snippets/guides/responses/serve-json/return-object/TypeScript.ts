import route from "primate/route";

export default route({
  get() {
    return ({ message: "Hello", data: [1, 2, 3] });
  },
});
