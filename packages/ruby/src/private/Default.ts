import Runtime from "#Runtime";
import type AppError from "@primate/core/AppError";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/request/verbs";
import assert from "@rcompat/assert";
import type FileRef from "@rcompat/fs/FileRef";
import io from "@rcompat/io";

const GEM = "primate-run";
const [MAJOR, MINOR] = TAG.split(".").map(Number);

function detect_routes(code: string): string[] {
  const found: string[] = [];
  for (const verb of verbs) {
    const rx = new RegExp(`\\bRoute\\.${verb.toLowerCase()}\\s*do\\b`);
    if (rx.test(code)) found.push(verb);
  }
  return found;
};

function gem_not_found(): AppError {
  return fail("missing {0}, run 'gem install {0} -v \"~> {1}.0\"'", GEM, TAG);
}

function pkg_mismatch(major: number, minor: number): AppError {
  return fail("installed {0} gem version {1}.{2}.x not in range {3}.x",
    GEM, major, minor, `~> ${TAG}`);
}

function pkg_not_found(): AppError {
  return fail(`gem not found in bundle - run 'bundle add ${GEM} -v "~> ${TAG}.0"' and bundle install`);
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

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version(app.root);

    app.bind(this.fileExtension, async (file, { context }) => {
      assert.true(context === "routes", "ruby: only route files are supported");

      const source = await file.text();
      const routes = detect_routes(source);

      if (routes.length === 0) throw fail("no routes detected in {0}", file);

      log.info("found routes in {0}: {1}", file, routes.join(", "));

      const id = file.debase(app.path.routes).path
        .replace(/^\//, "")
        .replace(/\.rb$/, "");

      return `
        import wrapper from "@primate/ruby/wrapper";
        await wrapper(${JSON.stringify(source)}, ${JSON.stringify(id)});
      `;
    });

    return next(app);
  }
}
