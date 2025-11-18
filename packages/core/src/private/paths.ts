import fail from "#fail";
import log from "#log";
import type FileRef from "@rcompat/fs/FileRef";
import type Dict from "@rcompat/type/Dict";

async function resolve(root: FileRef, config_paths?: Dict<string[]>) {
  const tsconfig_path = root.join("tsconfig.json");

  if (await tsconfig_path.exists()) {
    try {
      let text = await tsconfig_path.text();

      // strip JSONC features
      text = text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "")
        .replace(/,(\s*[}\]])/g, "$1");

      const config = JSON.parse(text);
      const ts_paths = config.compilerOptions?.paths ?? {};
      if (config_paths !== undefined && Object.keys(ts_paths).length > 0) {
        return fail("tsconfig.json exists with paths, remove config paths");
      }

      // merge with defaults (user paths override)
      return { ...ts_paths };

    } catch {
      log.warn("Failed to parse tsconfig.json, falling back to config");
    }
  }

  if (config_paths !== undefined) return config_paths;

  return {};
}

export default resolve;
