import I18NIndex from "@/views/i18n/Index";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(I18NIndex);
  },
});
