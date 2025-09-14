import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import type BuildApp from "@primate/core/BuildApp";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/request/verbs";
import wrap from "@primate/core/route/wrap";
import assert from "@rcompat/assert";
import user from "@rcompat/env/user";
import FileRef from "@rcompat/fs/FileRef";
import runtime from "@rcompat/runtime";
import execute from "@rcompat/stdio/execute";
import which from "@rcompat/stdio/which";
import upperfirst from "@rcompat/string/upperfirst";

const command = await which("go");
const env = {
  GOARCH: "wasm",
  GOCACHE: (await execute(`${command} env GOCACHE`, {})).replaceAll("\n", ""),
  GOOS: "js",
  HOME: user.HOME,
};

const run = (wasm: FileRef, go: FileRef) =>
  `${command} build -o ${wasm.name} ${go.name} request.go body.go`;

const verbs_string = verbs.map(upperfirst).join("|");
const routes_re = new RegExp(`func (?<route>${verbs_string})`, "gu");
const add_setter = (route: string) => `
  var cb${route} js.Func;
  cb${route} = js.FuncOf(func(this js.Value, args[]js.Value) any {
    cb${route}.Release();
    return make_request(${route}, args[0]);
  });
  js.Global().Set("${route}", cb${route});
`;

const make_route = (route: string) => `
route.${route.toLowerCase()}(async request => {
  const requested = await toRequest(request);
  const go = new globalThis.Go();
  return WebAssembly.instantiate(go_route, {...go.importObject}).then(result => {
    go.run(result.instance);
    return to_response(globalThis.${route}(requested));
  });
});`;

const js_wrapper = (path: string, routes: string[]) => `
import env from "@primate/go/env";
import toRequest from "@primate/go/to-request";
import to_response from "@primate/go/to-response";
import session from "#session";
import route from "primate/route";

globalThis.PRMT_SESSION = {
  get exists() {
    return session().exists;
  },
  get id() {
    return session().id;
  },
  create(data) {
    session().create(JSON.parse(data));
  },
  get() {
    return JSON.stringify(session().get());
  },
  try() {
    return JSON.stringify(session().try());
  },
  set(data) {
    session().set(JSON.parse(set));
  },
  destroy() {
    session().destroy();
  },
};

${(runtime as "bun" | "deno" | "node") === "bun"
    ? `import route_path from "${path}" with { type: "file" };
const go_route = await Bun.file(route_path).arrayBuffer();`
    :
    `import FileRef from "primate/runtime/FileRef";

const buffer = await FileRef.arrayBuffer(import.meta.url+"/../${path}");
const go_route = new Uint8Array(buffer);`
  }
env();

${routes.map(route => make_route(route)).join(",\n")}
`;

const go_wrapper = (code: string, routes: string[]) =>
  `${code.replace("package main",
    `package main

import "syscall/js"
`)}
// {{{ wrapper postfix
func main() {
  ${routes.map((route: string) => add_setter(route)).join("\n  ")}
  select{};
}
// }}} end`;

const get_routes = (code: string) => [...code.matchAll(routes_re)]
  .map(({ groups }) => groups!.route);

const type_map = {
  boolean: { transfer: "Bool", type: "bool" },
  f32: { transfer: "Float", type: "float32" },
  f64: { transfer: "Float", type: "float64" },
  i16: { transfer: "Int", type: "int16" },
  i32: { transfer: "Int", type: "int32" },
  i64: { transfer: "Int", type: "int64" },
  i8: { transfer: "Int", type: "int8" },
  string: { transfer: "String", type: "string" },
  u16: { transfer: "Int", type: "uint16" },
  u32: { nullval: "0", transfer: "Int", type: "uint32" },
  u64: { transfer: "Int", type: "uint64" },
  u8: { transfer: "Int", type: "uint8" },
  uuid: { transfer: "String", type: "string" },
};
const error_default = {
  Bool: false,
  Float: 0,
  Int: 0,
  String: "\"\"",
};
const root = new FileRef(import.meta.url).up(1);

const create_meta_files = async (directory: FileRef) => {
  const meta = {
    body: "body.go",
    mod: "go.mod",
    request: "request.go",
    sum: "go.sum",
  };

  if (!await directory.join(meta.request).exists()) {
    // copy request.go file
    await directory.join(meta.request).write((await root.join(meta.request)
      .text()),
    );
    await directory.join(meta.body).write((await root.join(meta.body)
      .text()),
    );
    await directory.join(meta.sum).write((await root.join(meta.sum).text()));
    await directory.join(meta.mod).write((await root.join(meta.mod).text()));
  }
};

export default class Default extends Runtime {
  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (route, { build, context }) => {
      assert(context === "routes", "go: only route files are supported");

      // build/stage/routes
      const directory = route.directory;
      // create meta files
      await create_meta_files(directory);

      const code = await route.text();
      const routes = get_routes(code);
      // write .go file
      await route.write(go_wrapper(code, routes));

      const wasm = route.bare(".wasm");

      const js_code = wrap(js_wrapper(wasm.name, routes), route, build);

      await route.append(".js").write(js_code);
      try {
        log.info("compiling {0} to WebAssembly", route);
        // compile .go to .wasm
        await execute(run(wasm, route), { cwd: `${directory}`, env });
      } catch (error) {
        throw new AppError("Error in module {0}\n{1}", route, error);
      };
    });

    return next(app);
  }
}
