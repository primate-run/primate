import voby from "@primate/voby";
import config from "primate/config";

export default config({
  http: { port: 10028 },
  modules: [voby()],
});
