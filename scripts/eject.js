import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/fs/project/root";
import execute from "@rcompat/stdio/execute";

const ORG = "primate-run";
const APPS_DIR = "../apps";
const EXCLUDE = ["website", "native", "grain"];
const monoroot = await root();
const apps = await monoroot.join("apps");
const org_base = a0 => `git@github.com:primate-run/${a0}-template.git`;
const templates = monoroot.join("../templates");
const ignore = ["build", "node_modules"];
const dirname = new FileRef(import.meta.dirname);
const readme = await dirname.join("README.template.md").text()

const get_npm_version = async name =>
  (await execute(`pnpm view ${name} version`)).split("\n")[0];
const has_changes = async cwd => {
  const status = await execute(`git status --porcelain`, { cwd });
  console.log("status", status)
  return status.trim().length > 0;
};

for (const app of await apps.list()) {
  if (EXCLUDE.includes(app.name)) continue;
  if (!await app.isDirectory()) continue;

  const target = templates.join(app.name);

  if (await target.exists()) await target.remove({ recursive: true });
  const command = `git clone --bare ${org_base(app.name)} ${app.name}/.git`;
  await execute(command, { cwd: templates.path });
  await execute(`git --git-dir=.git config --bool core.bare false`, { cwd: target.path });

  // copy metafiles from root
  await Promise.all([".gitignore", "LICENSE"].map(filename =>
    monoroot.join(filename).copy(target.join(filename))
  ));
  //
  const files = await app.list();
  for (const file of files) {
    if (ignore.includes(file.name)) continue;
    if (file.name === "package.json") {
      const pkg_json = await file.json();
      await target.join("README.md").write(readme.replaceAll("DESC",
        pkg_json.description));
      for (const [key, value] of Object.entries(pkg_json.dependencies)) {
        if (value === "workspace:^") {
          pkg_json.dependencies[key] = `^${await get_npm_version(key)}`;
        }
      }
      await target.join("package.json").writeJSON(pkg_json);
    } else {
      await file.copy(target.join(file.name));
    }
  }
  await execute(`git add -A`, { cwd: target.path });
  if (await has_changes(target.path)) {
    await execute(`git commit -m "sync"`, { cwd: target.path });
    await execute(`git push --set-upstream origin master`, { cwd: target.path });
    console.log(`✓ ${app.name}: changes pushed`);
  } else {
    console.log(`✓ ${app.name}: no changes`);
  }
}
