import p from "pema";
import route from "primate/route";

export default route({
  async post(request) {
    const { name } = p({ name: p.string.min(1) }).parse(await request.body.json());

    return `Hello, ${name}`;
  },
});
