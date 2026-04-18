import route from "primate/route";

export default route({
  get() {
    return [{ name: "Donald" }, { name: "Ryan" }];
  },
});
