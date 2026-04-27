import i18n from "#i18n";
import route from "primate/route";

export default route({
  get() {
    return i18n("welcome", { "name": "John", "count": 5 });
  },
});
