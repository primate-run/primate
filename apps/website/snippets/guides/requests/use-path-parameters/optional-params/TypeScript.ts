import route from "primate/route";

export default route({
  get(request) {
    const name = request.path.try("name") ?? "guest";
    return { name };
  },
});
