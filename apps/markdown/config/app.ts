import markdown from "@primate/markdown";
import config from "primate/config";

export default config({
  http: {
    port: 10008,
  },
  modules: [markdown()],
});
