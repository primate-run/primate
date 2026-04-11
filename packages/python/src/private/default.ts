import E from "#errors";
import type { Input } from "#module";
import module from "#module";
import type { BuildApp, Module } from "@primate/core";
import server from "@primate/core/server";
import assert from "@rcompat/assert";
import fs from "@rcompat/fs";
import io from "@rcompat/io";

const PACKAGE = "primate-run";
const [MAJOR, MINOR] = server.TAG.split(".").map(Number);

async function show_package(): Promise<string | null> {
  const str0 = () => "";

  let out = await io.run(`pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim().length > 0) return out;

  out = await io.run(`uv pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim().length > 0) return out;

  out = await io.run(`python -m pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim().length > 0) return out;

  return null;
}

async function check_version(app: BuildApp) {
  const output = await show_package();
  if (output === null) throw E.pkg_not_found();

  const version_match = output.match(/Version:\s*(\d+)\.(\d+)\.(\d+)/);
  if (version_match === null) throw E.pkg_not_found();

  const [major, minor] = version_match.slice(1).map(Number);
  if (major !== MAJOR || minor !== MINOR) throw E.pkg_mismatch(major, minor);

  app.log.info`using ${PACKAGE} package ${major}.${minor}.x`;
}

export default function default_module(input: Input = {}): Module {
  const { extension = module.extension } = module.schema.parse(input);

  return {
    name: module.name,

    setup({ onBuild }) {
      onBuild(async app => {
        await check_version(app);

        const requirements_txt = app.root.join("requirements.txt");
        let packages: string[] = [];
        if (await requirements_txt.exists()) {
          const requirements = await fs.text(requirements_txt);
          packages = requirements
            .split("\n")
            .filter(line => line.trim().length > 0 && !line.startsWith("#"))
            .map(p => p.trim());
        }
        const packages_str = JSON.stringify(packages);

        app.bind(extension, async (file, { context }) => {
          assert.true(context === "routes", E.only_route_files());

          const relative = file.debase(app.path.routes).path.replace(/^\//, "");
          const source = await file.text();

          return `
        import wrapper from "@primate/python/wrapper";
        import i18n from "app:config:i18n";
        import session from "app:config:session";
        await wrapper(
          ${JSON.stringify(source)},
          ${packages_str},
          "${PACKAGE}~=${server.TAG}.0",
          "${relative}",
          { i18n, session }
        );
      `;
        });
      });
    },
  };
}
