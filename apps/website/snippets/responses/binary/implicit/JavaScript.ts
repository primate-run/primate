import route from "primate/route";

export default route({
  get() {
    return new Blob(["data"]);
  },
});
