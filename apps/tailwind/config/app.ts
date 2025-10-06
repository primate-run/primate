import react from "@primate/react";
import tailwind from "@primate/tailwind";
import config from "primate/config";

export default config({
  http: {
    port: 10012,
  },
  modules: [react(), tailwind()],
});
