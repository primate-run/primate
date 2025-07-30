//import grain from "@primate/grain";
import html from "@primate/html";
import native from "@primate/native";
import config from "primate/config";

export default config({
  http: {
    port: 10009,
  },
  modules: [
    html(),
    //   grain(),
    native(),
  ],
});
