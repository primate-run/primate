import eta from "@primate/eta";
import config from "primate/config";

export default config({
  http: { port: 10026 },
  modules: [eta()],
});
