import session from "#session";
import route from "primate/route";

export default route({
  get() {
    return session.try() ?? null;
  },
});
