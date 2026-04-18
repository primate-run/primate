import SubmitForm from "#view/SubmitForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const FORM = p({
  email: p.string.email(),
});

export default route({
  get() {
    return response.view(SubmitForm);
  },
  post(request) {
    FORM.parse(request.body.form());
    return null;
  },
});
