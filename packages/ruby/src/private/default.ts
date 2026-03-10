import type { Input } from "#module";
import module from "#module";
import type { Module } from "@primate/core";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import verbs from "@primate/core/request/verbs";
import server from "@primate/core/server";
import assert from "@rcompat/assert";
import type { FileRef } from "@rcompat/fs";
import io from "@rcompat/io";

const GEM = "primate-run";
const [MAJOR, MINOR] = server.TAG.split(".").map(Number);

function detect_routes(code: string): string[] {
  const found: string[] = [];
  for (const verb of verbs) {
    const rx = new RegExp(`\\bRoute\\.${verb.toLowerCase()}\\s*do\\b`);
    if (rx.test(code)) found.push(verb);
  }
  return found;
}

function gem_not_found() {
  const command = `gem install ${GEM} -v "~> ${server.TAG}.0"`;
  return fail`missing ${GEM}, run ${command}`;
}

function pkg_mismatch(major: number, minor: number) {
  const range = `~> ${server.TAG}.x`;
  const version = `${major}.${minor}.x`;
  return fail`installed ${GEM} gem version ${version} not in range ${range}`;
}

function pkg_not_found() {
  const add = `bundle add ${GEM} -v "~> ${server.TAG}.0`;
  const install = "bundle install";
  return fail`gem not found in bundle - run ${add} and ${install}`;
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
  if (version === undefined) throw pkg_not_found();
  const version_match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (version_match === null) throw gem_not_found();
  const [, major, minor] = version_match.map(Number);
  if (major !== MAJOR || minor !== MINOR) throw pkg_mismatch(major, minor);
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
          assert.true(context === "routes", "ruby: only route files are supported");

          const source = await file.text();
          const routes = detect_routes(source);
          if (routes.length === 0) throw fail`no routes detected in ${file}`;
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
