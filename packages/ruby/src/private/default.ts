import E from "#errors";
import type { Input } from "#module";
import module from "#module";
import type { Module } from "@primate/core";
import log from "@primate/core/log";
import server from "@primate/core/server";
import assert from "@rcompat/assert";
import type { FileRef } from "@rcompat/fs";
import http from "@rcompat/http";
import io from "@rcompat/io";

const GEM = "primate-run";
const [MAJOR, MINOR] = server.TAG.split(".").map(Number);

function detect_routes(code: string): string[] {
  const found: string[] = [];
  for (const method of http.methods) {
    const rx = new RegExp(`\\bRoute\\.${method.toLowerCase()}\\s*do\\b`);
    if (rx.test(code)) found.push(method);
  }
  return found;
}

async function gem_version(root: FileRef): Promise<string | void> {
  const gemfile = root.join("Gemfile").path;
  const cmd =
    `BUNDLE_GEMFILE="${gemfile}" ` +
    `bundle exec ruby -e 'begin; puts Gem::Specification.find_by_name("${GEM}").version; rescue Gem::LoadError; exit 2; end'`;
  try {
    const out = (await io.run(cmd)).trim();
    if (out !== "") return out;
  } catch { }
}

async function check_version(root: FileRef) {
  const version = await gem_version(root);
  if (version === undefined) throw E.package_not_found();
  const version_match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (version_match === null) throw E.gem_not_found();
  const [, major, minor] = version_match.map(Number);
  if (major !== MAJOR || minor !== MINOR) throw E.package_mismatch(major, minor);
  log.info("using %s gem %d.%d.x", GEM, major, minor);
}

function wrap(source: string, id: string) {
  return `
    import wrapper from "@primate/ruby/wrapper";
    import i18n from "app:config:i18n";
    import session from "app:config:session";
    await wrapper(${JSON.stringify(source)}, ${JSON.stringify(id)}, {
      i18n, session,
    });
  `;
}

export default function default_module(input: Input = {}): Module {
  const { extension = module.extension } = module.schema.parse(input);

  return {
    name: module.name,

    setup({ onBuild }) {
      onBuild(async app => {
        await check_version(app.root);

        app.bind(extension, async (file, { context }) => {
          assert.true(context === "routes", E.only_route_files());

          const source = await file.text();
          const routes = detect_routes(source);
          if (routes.length === 0) throw E.no_routes_detected(file);
          log.info("found routes in {0}: {1}", file, routes.join(", "));

          const id = file.debase(app.path.routes).path
            .replace(/^\//, "")
            .replace(/\.rb$/, "");

          return wrap(source, id);
        });
      });
    },
  };
}
