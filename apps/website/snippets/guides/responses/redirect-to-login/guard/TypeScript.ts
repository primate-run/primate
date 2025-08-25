import session from "#session";
import redirect from "primate/response/redirect";
import route from "primate/route";

route.get(request => {
  // if at login page or session exists, pass through
  if (request.url.pathname === "/login" || session.exists()) {
    return null;
  }

  return redirect(`/login?next=${request.target}`);
});
