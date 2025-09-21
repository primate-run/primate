import build from "./build.js";
import serve from "./serve.js";

// build for development and serve
export default async () => {
  // will only serve is build is successful
  await build(["--target=web"], "development") === true && serve();
};
