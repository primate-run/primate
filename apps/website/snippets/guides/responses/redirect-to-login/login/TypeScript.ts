import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Login.jsx"));

route.post(request => {
  // do verification work, create session, etc.

  return response.redirect(request.query.get("next"));
});
