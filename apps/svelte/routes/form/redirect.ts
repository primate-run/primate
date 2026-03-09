import RedirectForm from "#view/RedirectForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const FORM = p({
  email: p.string.email(),
});

route.get(() => response.view(RedirectForm));
route.post(request => {
  request.body.form(FORM);
  return response.redirect("/form/redirected");
});
