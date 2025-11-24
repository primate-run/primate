import BuildApp from "#build/App";
import bye from "#bye";
import type Config from "#config/Config";
import default_config from "#config/index";
import fail from "#fail";
import log from "#log";
import type FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/fs/project/root";
import empty from "@rcompat/record/empty";
import Flags from "#Flags";

const no_config = (config?: Config) => config === undefined || empty(config);

const find_config = async (project_root: FileRef) => {
  const ts_config = project_root.join("config/app.ts");
  if (await ts_config.exists()) return ts_config;
  const js_config = project_root.join("config/app.js");
  if (await js_config.exists()) return js_config;
};

const get_config = async (project_root: FileRef) => {
  const config = await find_config(project_root);
  if (config !== undefined) {
    try {
      const imported = await config.import("default");

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
    const package_root = await root();
    const flags = Flags.parse(input);
    const config = await get_config(package_root) as Config;

    const app = await new BuildApp(package_root, config, flags).init();

    await (app as BuildApp).buildInit();
    return true;
  } catch (error) {
    log.error(error);
    bye();
  }
};
