import p from "pema";
import route from "primate/route";

const Path = p.async({
  name: p.string,
}).derive(async ({ name }) => ({
  name: name.toUpperCase(),
}));

export default route({
  get: route.with({ path: Path }, request => {
    return request.path.get("name");
  }),
});
