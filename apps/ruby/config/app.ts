import config from "primate/config";
import ruby from "@primate/ruby";
import html from "@primate/html";

export default config({
  modules: [ruby(), html()],
});
