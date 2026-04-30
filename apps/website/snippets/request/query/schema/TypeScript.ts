import p from "pema";
import route from "primate/route";

const QuerySchema = p({
  page: p.int.loose.min(1).default(1),
  search: p.string.min(1),
});

export default route({
  get(request) {
    const { page, search } = QuerySchema.parse(request.query);
    return `Searching '${search}' (page ${page})`;
  },
});
