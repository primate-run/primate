import { s_config } from "#app/Facade";
import BuildApp from "#build/App";
import type Config from "#config/Config";
import default_config from "#config/index";
import E from "#errors";
import Flags from "#Flags";
import dict from "@rcompat/dict";
import type { FileRef } from "@rcompat/fs";

const no_config = (config?: Config) =>
  config === undefined || dict.empty(config);

async function find_config(root: FileRef): Promise<FileRef | undefined> {
  const ts_config = root.join("config/app.ts");
  if (await ts_config.exists()) return ts_config;
  const js_config = root.join("config/app.js");
  if (await js_config.exists()) return js_config;
};

async function get_config(root: FileRef): Promise<Config> {
  const config_file = await find_config(root);
  if (config_file === undefined) return default_config()[s_config];

  try {
    const imported = (await config_file.import("default"))[s_config];
    if (no_config(imported)) throw E.config_file_empty(config_file);

    return imported;
  } catch (error) {
    throw E.config_file_error(config_file, error as Error);
  }
};

async function build(root: FileRef, input: typeof Flags.input) {
  const flags = Flags.parse(input);
  const config = await get_config(root);
  const app = await new BuildApp(root, config, flags).init();

  await (app as BuildApp).buildInit();
  return app;
};

export default build;
