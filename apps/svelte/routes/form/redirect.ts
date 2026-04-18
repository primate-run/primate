import RedirectForm from "#view/RedirectForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const FORM = p({
  email: p.string.email(),
});

export default route({
  get() {
    return response.view(RedirectForm);
  },
  post(request) {
    FORM.parse(request.body.form());
    return response.redirect("/form/redirected");
  },
});
