import p from "pema";
import route from "primate/route";

const PathSchema = p({ id: p.string.regex(/^\d+$/) });

route.get(request => {
  const { id } = request.path.parse(PathSchema); // id: string (digits only)
  return `User #${id}`;
});
