import build from "./build.js";

// build for development
export default () => build(["--target=web"], "development");
