import type BuildApp from "#build/App";
import E from "#errors";

async function resolve(app: BuildApp) {
  const tsconfig_path = app.root.join("tsconfig.json");

  if (await tsconfig_path.exists()) {
    try {
      let text = await tsconfig_path.text();

      // strip JSONC features
      text = text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "")
        .replace(/,(\s*[}\]])/g, "$1");

      const config = JSON.parse(text);
      const paths = config.compilerOptions?.paths ?? {};

      // merge with defaults (user paths override)
      return { ...paths };

    } catch (cause) {
      throw E.config_failed_to_parse_tsconfig(tsconfig_path, cause as Error);
    }
  }

  return {};
}

export default resolve;
