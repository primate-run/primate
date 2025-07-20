import config from "primate/config";
import markdown from "@primate/markdown";

export default config({
  http: {
    port: 10006,
  },
  modules: [markdown()],
});
