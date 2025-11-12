import Runtime from "#Runtime";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";

const PACKAGE = "primate-run";
const [MAJOR, MINOR] = TAG.split(".").map(Number);

function package_not_found() {
  return fail("package not found - run 'pip install {0}~={1}.0'", PACKAGE, TAG);
}

function pkg_mismatch(major: number, minor: number) {
  return fail(
    "installed {0} package version {1}.{2}.x not in range ~> {3}.x",
    PACKAGE,
    major,
    minor,
    TAG,
  );
}

async function show_package(): Promise<string | null> {
  const str0 = () => "";

  let out = await execute(`pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim()) return out;

  out = await execute(`uv pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim()) return out;

  out = await execute(`python -m pip show ${PACKAGE} 2>/dev/null`).catch(str0);
  if (out.trim()) return out;

  return null;
}

async function check_version() {
  const output = await show_package();
  if (!output) throw package_not_found();

  const version_match = output.match(/Version:\s*(\d+)\.(\d+)\.(\d+)/);
  if (!version_match) throw package_not_found();

  const [major, minor] = version_match.slice(1).map(Number);
  if (major !== MAJOR || minor !== MINOR) throw pkg_mismatch(major, minor);

  log.info("using {0} package {1}.{2}.x", PACKAGE, major, minor);
}

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version();

    const requirements_txt = app.root.join("requirements.txt");
    let packages: string[] = [];
    if (await requirements_txt.exists()) {
      const requirements = await FileRef.text(requirements_txt);
      packages = requirements
        .split("\n")
        .filter(line => line.trim() && !line.startsWith("#"))
        .map(p => p.trim());
    }
    const packages_str = JSON.stringify(packages);

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "python: only route files are supported");
      const relative = route.debase(app.path.routes).path.replace(/^\//, "");
      return `
        import wrapper from "@primate/python/wrapper";
        import py_route from "${route.path}";

        await wrapper(
          py_route,
          ${packages_str},
          "${PACKAGE}~=${TAG}.0",
          "${relative}"
        );
        `;
    });

    return next(app);
  }
}
