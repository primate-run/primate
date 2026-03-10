import type { Input } from "#module";
import module from "#module";
import type { Module } from "@primate/core";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import server from "@primate/core/server";
import assert from "@rcompat/assert";
import fs from "@rcompat/fs";
import io from "@rcompat/io";

const PACKAGE = "primate-run";
const [MAJOR, MINOR] = server.TAG.split(".").map(Number);

function package_not_found() {
  const command = `pip install ${PACKAGE}~=${server.TAG}.0`;
  return fail`package not found, run ${command}`;
}

function pkg_mismatch(major: number, minor: number) {
  const range = `~> ${server.TAG}.x`;
  const version = `${major}.${minor}.x`;
  return fail`${PACKAGE} package version ${version} not in range ${range}`;
}

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

async function check_version() {
  const output = await show_package();
  if (output === null) throw package_not_found();

  const version_match = output.match(/Version:\s*(\d+)\.(\d+)\.(\d+)/);
  if (version_match === null) throw package_not_found();

  const [major, minor] = version_match.slice(1).map(Number);
  if (major !== MAJOR || minor !== MINOR) throw pkg_mismatch(major, minor);

  log.info("using {0} package {1}.{2}.x", PACKAGE, major, minor);
}

export default function default_module(input: Input = {}): Module {
  const { extension = module.extension } = module.schema.parse(input);

  return {
    name: module.name,

    setup({ onBuild }) {
      onBuild(async app => {
        await check_version();

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
          assert.true(context === "routes",
            "python: only route files are supported");

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
