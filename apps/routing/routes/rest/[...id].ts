import p from "pema";
import route from "primate/route";

const PathSchema = p({
  id: p.string,
});

export default route({
  get: route.with({ path: PathSchema }, request => request.path.get("id")),
});
