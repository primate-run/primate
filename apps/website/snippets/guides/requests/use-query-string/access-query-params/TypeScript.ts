// routes/search.ts
import route from "primate/route";

export default route({
  get(request) {
    const q = request.query.get("q");
    const limit = request.query.try("limit") ?? 10;
    return { q, limit };
  },
});
