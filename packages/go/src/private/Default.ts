import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import type BuildApp from "@primate/core/BuildApp";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/verbs";
import assert from "@rcompat/assert";
import user from "@rcompat/env/user";
import FileRef from "@rcompat/fs/FileRef";
import runtime from "@rcompat/runtime";
import execute from "@rcompat/stdio/execute";
import which from "@rcompat/stdio/which";
import upperfirst from "@rcompat/string/upperfirst";

const command = await which("go");
const env = {
  GOOS: "js",
  GOARCH: "wasm",
  GOCACHE: (await execute(`${command} env GOCACHE`, {})).replaceAll("\n", ""),
};

const run = (wasm: FileRef, go: FileRef) =>
  `${command} build -o ${wasm.name} ${go.name} request.go`;

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

const make_route = (route: string) =>
  `  ${route.toLowerCase()}(request) {
    const go = new globalThis.Go();
    return WebAssembly.instantiate(route, {...go.importObject}).then(result => {
      go.run(result.instance);
      return to_response(globalThis.${route}(to_request(request)));
    });
  }`;

const js_wrapper = (path: string, routes: string[]) => `
import env from "@primate/go/env";
import to_request from "@primate/go/to-request";
import to_response from "@primate/go/to-response";
import session from "primate/config/session";

globalThis.PRMT_SESSION = {
  get new() {
    return session().new;
  },
  get id() {
    return session().id;
  },
  get data() {
    return JSON.stringify(session().data);
  },
  create(data) {
    session().create(JSON.parse(data));
  },
  destroy() {
    session().destroy();
  },
};

${
  (runtime as "node" | "bun" | "deno") === "bun"
? `import route_path from "${path}" with { type: "file" };
const route = await Bun.file(route_path).arrayBuffer();`
:
`import FileRef from "primate/runtime/FileRef";

const buffer = await FileRef.arrayBuffer(import.meta.url+"/../${path}");
const route = new Uint8Array(buffer);`
}
env();

export default {
${routes.map(route => make_route(route)).join(",\n")}
};`;

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
  i8: { transfer: "Int", type: "int8" },
  i16: { transfer: "Int", type: "int16" },
  i32: { transfer: "Int", type: "int32" },
  i64: { transfer: "Int", type: "int64" },
  f32: { transfer: "Float", type: "float32" },
  f64: { transfer: "Float", type: "float64" },
  u8: { transfer: "Int", type: "uint8" },
  u16: { transfer: "Int", type: "uint16" },
  u32: { transfer: "Int", type: "uint32", nullval: "0" },
  u64: { transfer: "Int", type: "uint64" },
  string: { transfer: "String", type: "string" },
  uuid: { transfer: "String", type: "string" },
};
const error_default = {
  Bool: false,
  Int: 0,
  Float: 0,
  String: "\"\"",
};
const root = new FileRef(import.meta.url).up(1);

const create_meta_files = async (directory: FileRef) => {
  const meta = {
    request: "request.go",
    sum: "go.sum",
    mod: "go.mod",
  };

  if (!await directory.join(meta.request).exists()) {
    // copy request.go file
    await directory.join(meta.request).write((await root.join(meta.request)
      .text()),
    );
    await directory.join(meta.sum).write((await root.join(meta.sum).text()));
    await directory.join(meta.mod).write((await root.join(meta.mod).text()));
  }
};

export default class Default extends Runtime {
  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (go, context) => {
      assert(context === "routes", "go: only route files are supported");

      // build/stage/routes
      const directory = go.directory;
      // create meta files
      await create_meta_files(directory);

      const code = await go.text();
      const routes = get_routes(code);
      // write .go file
      await go.write(go_wrapper(code, routes));

      const wasm = go.bare(".wasm");

      await go.append(".js").write(js_wrapper(wasm.name, routes));
      try {
        log.info(`compiling {0} to WebAssembly`, go);
        const cwd = `${directory}`;
        // compile .go to .wasm
        await execute(run(wasm, go), { cwd, env: { HOME: user.HOME, ...env } });
      } catch (error) {
        throw new AppError(`Error in module {0}\n{1}`, go, error);
      }
    });

    return next(app);
  }
}
