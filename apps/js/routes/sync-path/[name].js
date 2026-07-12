import p from "pema";
import route from "primate/route";

const Path = p({
  name: p.string,
});

export default route({
  get: route.with({ path: Path }, request => {
    return request.path.get("name");
  }),
});
