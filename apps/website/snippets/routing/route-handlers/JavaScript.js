import route from "primate/route";

export default route({
  get(request) {
    return "Hello from GET!";
  },
  post(request) {
    return "Hello from POST!";
  },
});
