import response from "primate/response";
import route from "primate/route";

type I18NContext = {
  locale: "en-US" | "de-DE";
};

export default route({
  get(request) {
    return response.view("i18n/Layout.marko", {
      locale: request.get<I18NContext>("i18n").locale,
    });
  },
});
