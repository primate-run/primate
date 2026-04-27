import route from "primate/route";

export default route({
  get(request) {
    const page = Number(request.query.try("page") ?? "1"); // 1 if missing
    const term = request.query.get("search");
    return `Searching '${term}' (page ${page})`;
  },
});
