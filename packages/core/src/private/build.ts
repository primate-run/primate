import BuildApp from "#BuildApp";
import bye from "#bye";
import type Config from "#config/Config";
import default_config from "#config/index";
import empty_config_file from "#error/empty-config-file";
import error_in_config_file from "#error/error-in-config-file";
import type { PrimateError } from "#log";
import type Mode from "#Mode";
import type FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/package/root";
import empty from "@rcompat/record/empty";
import runtime from "@rcompat/runtime";

const empty_config = (config?: Config) => config === undefined || empty(config);

const find_config = async (project_root: FileRef) => {
  const ts_config = project_root.join("config/app.ts");
  if (await ts_config.exists()) {
    return ts_config;
  }
  const js_config = project_root.join("config/app.js");
  if (await js_config.exists()) {
    return js_config;
  }
};

const get_config = async (project_root: FileRef) => {
  const config = await find_config(project_root);
  if (config !== undefined) {
    try {
      const imported = await config.import("default");

      if (empty_config(imported)) {
        empty_config_file(config.toString());
      }

      return imported;
    } catch (error) {
      const primate_error = error as PrimateError;
      if (primate_error.level === "error") {
        error_in_config_file(primate_error.message, `${runtime} ${config}`);
      } else {
        throw error;
      }
    }
  }
  return default_config();
};

export default async (mode: Mode, target: string) => {
  try {
    const package_root = await root();
    const app_config = await get_config(package_root);
    await new BuildApp(package_root, app_config, mode).initBuild(target);
    return true;
  } catch (error) {
    if ((error as PrimateError).level === "error") {
      bye();
      return;
    }
    throw error;
  }
};
