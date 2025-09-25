import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/request/verbs";
import wrap from "@primate/core/route/wrap";
import assert from "@rcompat/assert";
import type FileRef from "@rcompat/fs/FileRef";

/** find which HTTP verbs are present in the Ruby file */
const detect_routes = (code: string): string[] => {
  const found: string[] = [];
  for (const verb of verbs) {
    const rx = new RegExp(`\\bRoute\\.${verb.toLowerCase()}\\s*do\\b`);
    if (rx.test(code)) found.push(verb);
  }
  return found;
};

const js_wrapper = async (fileRef: FileRef, routes: string[]) => {
  const userRubyRaw = await fileRef.text();
  const userRuby = userRubyRaw.replace(/`/g, "\\`");

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
${userRuby}

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

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    app.bind(this.fileExtension, async (route, { build, context }) => {
      assert(context === "routes", "ruby: only route files are supported");

      const src = await route.text();
      const routes = detect_routes(src);
      if (routes.length === 0) {
        log.warn("No routes detected in {0}. Use Route.get, Route.post, etc.", route);
        return;
      }

      log.info("Found routes in {0}: {1}", route, routes.join(", "));

      const jsCode = wrap(await js_wrapper(route, routes), route, build);
      await route.append(".js").write(jsCode);
    });

    return next(app);
  }
}
