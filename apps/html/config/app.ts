import html from "@primate/html";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  modules: [
    html(),
  ],
});
