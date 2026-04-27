import route from "primate/route";

export default route({
  get(request) {
    return request.query.try("foo") ?? "foo missing";
  },
});
