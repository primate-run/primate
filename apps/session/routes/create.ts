import session from "#session";
import route from "primate/route";

route.get(() => {
  session.create({ foo2: "bar" });

  // return session data as JSON
  return session.get();
});
