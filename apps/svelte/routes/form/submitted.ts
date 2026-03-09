import SubmitForm from "#view/SubmitForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const FORM = p({
  email: p.string.email(),
});

route.get(() => response.view(SubmitForm));
route.post(request => {
  request.body.form(FORM);
  return null;
});
