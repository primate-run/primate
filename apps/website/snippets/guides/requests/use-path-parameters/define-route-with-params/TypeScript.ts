import route from "primate/route";

export default route({
  get(request) {
    const id = request.path.get("id");
    return { id };
  },
});
