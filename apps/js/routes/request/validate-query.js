import p from "pema";
import route from "primate/route";

const Schema = p({
  foo: p.string,
  baz: p.u32,
});

export default route({
  get(request) {
    return Schema.coerce(request.query.toJSON());
  },
});
