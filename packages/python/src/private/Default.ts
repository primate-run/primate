import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import verbs from "@primate/core/verbs";
import assert from "@rcompat/assert";
import type FileRef from "@rcompat/fs/FileRef";

const routes_re = new RegExp(`def (?<route>${verbs.join("|")})`, "gu");
const get_routes = (code: string) => [...code.matchAll(routes_re)]
  .map(({ groups }) => groups!.route);

const make_route = (route: string) => `async ${route.toLowerCase()}(request) {
  const ${route}_fn = pyodide.globals.get("${route}");
  return to_response(await ${route}_fn(to_request(pyodide.toPy, request)));
}`;

const make_package = (pkg: string) => `await pyodide.loadPackage("${pkg}", {
  messageCallback: _ => _,
});\n`;
const js_wrapper = (path: FileRef, routes: string[], packages: string[]) => `
  import FileRef from "primate/runtime/FileRef";
  import to_request from "@primate/python/to-request";
  import to_response from "@primate/python/to-response";
  import load from "@primate/python/load";
  import namespace from "@primate/python/namespace";

  const pyodide = await load({ indexURL: "./node_modules/pyodide" });
  const route = await FileRef.text(${JSON.stringify(path.toString())});
  ${packages.map(make_package)}
  pyodide.registerJsModule("primate", namespace);

  pyodide.runPython(route);

  export default {
    ${routes.map(route => make_route(route)).join(",\n")}
  };
`;

export default class Default extends Runtime {
  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (file, context) => {
      assert(context === "routes", "python: only route files are supported");

      const code = await file.text();
      const routes = get_routes(code);
      // write .js wrapper
      await file.append(".js").write(js_wrapper(file, routes, this.packages));
    });

    return next(app);
  }
};
