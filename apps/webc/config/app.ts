import webc from "@primate/webc";
import config from "primate/config";

export default config({
  http: {
    port: 10020,
  },
  modules: [webc()],
});
