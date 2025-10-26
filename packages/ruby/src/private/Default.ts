import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/request/verbs";
import assert from "@rcompat/assert";
import type FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";

const GEM = "primate-run";
const [MAJOR, MINOR] = TAG.split(".").map(Number);

const detect_routes = (code: string): string[] => {
  const found: string[] = [];
  for (const verb of verbs) {
    const rx = new RegExp(`\\bRoute\\.${verb.toLowerCase()}\\s*do\\b`);
    if (rx.test(code)) found.push(verb);
  }
  return found;
};

const wrapper = async (fileRef: FileRef, routes: string[]) => {
  const original_ruby = await fileRef.text();
  const user_ruby = original_ruby.replace(/`/g, "\\`");
  return `
import route from "primate/route";
import to_request from "@primate/ruby/to-request";
import to_response from "@primate/ruby/to-response";
import helpers from "@primate/ruby/helpers";
import session from "primate/config/session";
import ruby from "@primate/ruby/ruby";
import wasi from "@primate/ruby/wasi";

const { vm } = await wasi(ruby, {
  env: {
    BUNDLE_GEMFILE: "/app/Gemfile",
    BUNDLE_PATH: "/app/vendor/bundle"
  },
  preopens: {
    "/app": process.cwd()
  },
});

await vm.evalAsync(\`
  Dir.glob("/app/vendor/bundle/ruby/*/gems/*/lib").each do |lib_path|
    $LOAD_PATH << lib_path unless $LOAD_PATH.include?(lib_path)
  end
\`);

const environment = await vm.evalAsync(\`
${user_ruby}

${routes.map(route => `
def run_${route.toUpperCase()}(js_request, helpers, session_obj)
  Route.set_session(session_obj, helpers)
  request = Request.new(js_request, helpers)
  Route.call_route("${route.toUpperCase()}", request)
end`).join("\n")}
\`);

${routes.map(route => `
route.${route.toLowerCase()}(async request => {
  try {
    return to_response(await environment.callAsync("run_${route.toUpperCase()}",
      vm.wrap(await to_request(request)), vm.wrap(helpers), vm.wrap(session())));
  } catch (e) {
    console.error("ruby error (${route})", e);
    return { status: 500, body: "Ruby execution error: " + e.message };
  }
});`).join("\n")}
`;
};

function gem_not_found() {
  return fail("missing {0}, run 'gem install {0} -v \"~> {1}.0\"'", GEM, TAG);
}

function gem_mismatch(major: number, minor: number) {
  return fail("installed {0} gem version {1}.{2}.x not in range {3}.x",
    GEM, major, minor, `~> ${TAG}`);
}

async function check_version() {
  try {
    const output = await execute(`gem specification ${GEM} version 2>/dev/null`);
    const version_match = output.match(/(\d+)\.(\d+)\.(\d+)/);

    if (!version_match) throw gem_not_found();

    const [, major, minor] = version_match.map(Number);

    if (major !== MAJOR || minor !== MINOR) throw gem_mismatch(major, minor);

    log.info("using {0} gem {1}.{2}.x", GEM, major, minor);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw gem_not_found();
  }
}

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version();

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "ruby: only route files are supported");

      const code = await route.text();
      const routes = detect_routes(code);

      if (routes.length === 0) throw fail("no routes detected in {0}", route);

      log.info("found routes in {0}: {1}", route, routes.join(", "));

      return await wrapper(route, routes);
    });

    return next(app);
  }
}
