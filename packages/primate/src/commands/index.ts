import c from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import build from "./build.js";
import dev from "./dev.js";
import init from "./init.js";
import migrate_apply from "./migrate-apply.js";
import migrate_create from "./migrate-create.js";
import migrate_status from "./migrate-status.js";
import serve from "./serve.js";
import test from "./test.js";

const commands = {
  build,
  dev,
  init,
  serve,
  test,
  migrate_apply,
  migrate_create,
  migrate_status,
};

function unknown(command: string) {
  return () => {
    print(`Unknown command ${c.dim(command)}\n`);
  };
};

function in_commands(command: string): command is keyof typeof commands {
  return Object.keys(commands).find(key =>
    key === command || key.startsWith(command)) !== undefined;
}

export default function run_command(command_flag: string = "") {
  const [command, action = ""] = command_flag.trim().split(":");
  if (command === "") return dev;

  if (in_commands(command)) {
    if (action === "") return commands[command];
    else {
      const subcommand = `${command}_${action}`;
      if (in_commands(subcommand)) return commands[subcommand];
      return unknown(subcommand.replace("_", ":"));
    }
  }
  return unknown(command);
};
