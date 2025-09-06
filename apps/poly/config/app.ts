import poly from "@primate/poly";
import config from "primate/config";

export default config({
  http: {
    port: 10010,
  },
  modules: [poly()],
});
