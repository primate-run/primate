import I18NLayout from "#view/i18n/Layout";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(I18NLayout);
  },
});
