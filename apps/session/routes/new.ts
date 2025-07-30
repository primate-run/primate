import session from "#session";
import route from "primate/route";

route.get(() => {
  if (session.new) {
    return "no session";
  }
  return `session (${session.id})`;
});
