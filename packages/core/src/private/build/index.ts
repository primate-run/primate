import BuildApp from "#build/App";
import bye from "#bye";
import type Config from "#config/Config";
import default_config from "#config/index";
import fail from "#fail";
import Flags from "#Flags";
import log from "#log";
import dict from "@rcompat/dict";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import { s_config } from "#app/Facade";

const no_config = (config?: Config) =>
  config === undefined || dict.empty(config);

const find_config = async (root: FileRef) => {
  const ts_config = root.join("config/app.ts");
  if (await ts_config.exists()) return ts_config;
  const js_config = root.join("config/app.js");
  if (await js_config.exists()) return js_config;
};

const get_config = async (root: FileRef) => {
  const config = await find_config(root);
  if (config !== undefined) {
    try {
      const imported = (await config.import("default"))[s_config];

      if (no_config(imported)) throw fail("empty config file at {0}", config);

      return imported;
    } catch (error) {
      throw fail("error in config file {0}", error);
    }
  }
  return default_config();
};

export default async (input: typeof Flags.input) => {
  try {
    const root = await fs.project.root();
    const flags = Flags.parse(input);
    const config = await get_config(root) as Config;
    const app = await new BuildApp(root, config, flags).init();

    await (app as BuildApp).buildInit();
    return true;
  } catch (error) {
    log.error(error);
    bye();
  }
};
