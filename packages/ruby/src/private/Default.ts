import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import wrap from "@primate/core/route/wrap";
import verbs from "@primate/core/verbs";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";

const routes_re = new RegExp(`def (?<route>${verbs.join("|")})`, "gu");
const get_routes = (code: string) => [...code.matchAll(routes_re)]
  .map(({ groups }) => groups!.route);

const this_directory = new FileRef(import.meta.url).up(1);
const request = await this_directory.join("./request.rb").text();
const make_route = (route: string) => `
route.${route.toLowerCase()}(async request => {
  try {
    return to_response(await environment.callAsync("run_${route}",
      vm.wrap(request), vm.wrap(helpers), vm.wrap(session())));
  } catch (e) {
    console.log("ruby error", e);
    return "Ruby error";
  }
});`;

const type_map = {
  i8: { transfer: "to_i", type: "int8" },
  i16: { transfer: "to_i", type: "int16" },
  i32: { transfer: "to_i", type: "int32" },
  i64: { transfer: "to_i", type: "int64" },
  f32: { transfer: "to_f", type: "float32" },
  f64: { transfer: "to_f", type: "float64" },
  u8: { transfer: "to_i", type: "uint8" },
  u16: { transfer: "to_i", type: "uint16" },
  u32: { transfer: "to_i", type: "uint32", nullval: "0" },
  u64: { transfer: "to_i", type: "uint64" },
  string: { transfer: "to_s", type: "string" },
  uuid: { transfer: "to_s", type: "string" },
};

const create_ruby_wrappers = (routes: string[]) => routes.map(route =>
  `
def run_${route}(js_request, helpers, session)
  Primate.set_session(session, helpers)
  ${route}(Request.new(js_request, helpers))
end
`).join("\n");
const js_wrapper = async (path: FileRef, routes: string[]) => {
  const classes: string[] = [];
  const request_initialize: string[] = [];
  const request_defs: string[] = [];

  return `
import FileRef from "primate/runtime/FileRef";
import route from "primate/route";
import to_response from "@primate/ruby/to-response";
import helpers from "@primate/ruby/helpers";
import default_ruby_vm from "@primate/ruby/default-ruby-vm";
import ruby from "@primate/ruby/ruby";
import session from "primate/config/session";

const { vm } = await default_ruby_vm(ruby);
const code = await FileRef.text(${JSON.stringify(path.toString())});
const wrappers = ${JSON.stringify(create_ruby_wrappers(routes))};
const request = ${JSON.stringify(request
    .replace("%%CLASSES%%", _ => classes.join("\n"))
    .replace("%%REQUEST_INITIALIZE%%", _ => request_initialize.join("\n"))
    .replace("%%REQUEST_DEFS%%", _ => request_defs.join("\n")))};

const environment = await vm.evalAsync(request+code+wrappers);

${routes.map(route => make_route(route)).join("\n  ")}
`;
};

export default class Default extends Runtime {
  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (route, { context, build }) => {
      assert(context === "routes", "ruby: only route files are supported");

      const code = await route.text();
      const routes = get_routes(code);

      const js_code = wrap(await js_wrapper(route, routes), route, build);
      // write .js wrapper
      await route.append(".js").write(js_code);
    });

    return next(app);
  }
};
