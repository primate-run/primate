import route from "primate/route";
import i18n from "#i18n";

export default route({
  get() {
    return i18n("welcome", { name: "John", count: 5 });
  },
});
