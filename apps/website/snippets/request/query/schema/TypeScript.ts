import pema from "pema";
import int from "pema/int";
import string from "pema/string";
import route from "primate/route";

const Query = pema({
  page: int.coerce.min(1).default(1),
  search: string.min(1),
});

route.get(request => {
  const { page, search } = request.query.parse(Query);
  return `Searching '${search}' (page ${page})`;
});
