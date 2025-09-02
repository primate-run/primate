import session from "#session";
import route from "primate/route";

route.get(() => {
  session.create({ foo: "bar" });

  return session.get();
});
