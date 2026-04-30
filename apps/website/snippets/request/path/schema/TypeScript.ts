import p from "pema";
import route from "primate/route";

const PathSchema = p({ id: p.string.regex(/^\d+$/) });

export default route({
  get(request) {
    const { id } = PathSchema.parse(request.path); // id: string (digits only)
    return `User #${id}`;
  },
});
