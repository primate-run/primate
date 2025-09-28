import session from "#session";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  // if at login page or session exists, pass through
  if (request.url.pathname === "/login" || session.exists()) {
    return null;
  }

  return response.redirect(`/login?next=${request.target}`);
});
