import webc from "@primate/webc";
import config from "primate/config";

export default config({
  http: {
    port: 10021,
  },
  modules: [webc()],
});
