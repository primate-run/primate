import session from "#session";
import route from "primate/route";

route.get(() => {
  if (!session.exists) return "no session";
  return {
    id: session.id,
    ...session.get(),
  };
});
