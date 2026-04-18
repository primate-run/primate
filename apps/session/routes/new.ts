import session from "#session";
import route from "primate/route";

export default route({
  get() {
    if (!session.exists) return "no session";

    return {
      id: session.id,
      ...session.get(),
    };
  },
});
