import build from "./build.js";
import serve from "../runtime/serve.js";

const name = "json";

export default ({ database }) => ({
  build: build(name),
  serve: serve(database),
});
