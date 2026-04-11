import build from "./build.js";
import type Command from "./Command.js";

const command_dev: Command = () => {
  build("development");
};

export default command_dev;
