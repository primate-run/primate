import session from "#session";
import route from "primate/route";

export default route({
  get() {
    session.create({ foo: "bar" });

    // return session data as JSON
    return session.get();
  },
});
