import react from "@primate/react";
import config from "primate/config";

export default config({
  http: { port: 10021 },
  modules: [react({ ssr: false })],
});
