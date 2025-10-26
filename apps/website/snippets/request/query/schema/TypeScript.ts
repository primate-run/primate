import p from "pema";
import route from "primate/route";

const QuerySchema = p({
  page: p.int.coerce.min(1).default(1),
  search: p.string.min(1),
});

route.get(request => {
  const { page, search } = request.query.parse(QuerySchema);
  return `Searching '${search}' (page ${page})`;
});
