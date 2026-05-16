import session from "#session";
import response from "primate/response";
import route from "primate/route";

export default route.hook((request, next) => {
  // if at login page or session exists, pass through
  if (request.url.pathname === "/login" || session.exists()) {
    return next(request);
  }

  return response.redirect(`/login?next=${request.target}`);
});
