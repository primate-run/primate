import response from "primate/response";
import route from "primate/route";

type I18NContext = {
  locale: "en-US" | "de-DE";
};

const title = {
  "en-US": "Title",
  "de-DE": "Titel",
};

export default route({
  get(request) {
    const locale = request.get<I18NContext>("i18n").locale;
    return response.view("i18n/Index.marko", {
      locale,
      title: title[locale],
    });
  },
});
