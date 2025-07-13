import i18n from "@primate/i18n";
import poly from "@primate/poly";
import config from "primate/config";

export default config({
  modules: [poly(), i18n()],
});
