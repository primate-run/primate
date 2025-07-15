import config from "primate/config";
import markdown from "@primate/markdown";

export default config({
  modules: [markdown()],
  http: {
    port: 10005,
  },
});
