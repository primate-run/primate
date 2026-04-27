import marko from "@primate/marko";
import config from "primate/config";

export default config({
  http: {
    port: 10675, // 10MRK
  },
  modules: [
    marko(),
  ],
});
