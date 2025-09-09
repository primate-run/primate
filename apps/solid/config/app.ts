import solid from "@primate/solid";
import config from "primate/config";

export default config({
  http: {
    port: 10017,
  },
  modules: [solid()],
});
