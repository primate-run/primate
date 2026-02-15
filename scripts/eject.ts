import fs from "@rcompat/fs";
import io from "@rcompat/io";

const EXCLUDE = ["website", "native"];
const monoroot = await fs.project.root();
const apps = monoroot.join("apps");
const org_base = (a: string) => `git@github.com:primate-run/${a}-template.git`;
const templates = monoroot.join("../templates");
const ignore = ["build", "node_modules"];
const dirname = fs.ref(import.meta.dirname);
const readme = await dirname.join("README.template.md").text();

const get_npm_version = async (name: string) =>
  (await io.run(`pnpm view ${name} version`)).split("\n")[0];
const has_changes = async (cwd: string) => {
  const status = await io.run("git status --porcelain", { cwd });
  console.log("status", status);
  return status.trim().length > 0;
};

for (const app of await apps.dirs()) {
  if (EXCLUDE.includes(app.name)) continue;

  const target = templates.join(app.name);

  if (await target.exists()) await target.remove({ recursive: true });
  const command = `git clone --bare ${org_base(app.name)} ${app.name}/.git`;
  await io.run(command, { cwd: templates.path });
  await io.run("git --git-dir=.git config --bool core.bare false", {
    cwd: target.path,
  });

  // copy metafiles from root
  await Promise.all([".gitignore", "LICENSE"].map(filename =>
    monoroot.join(filename).copy(target.join(filename)),
  ));
  //
  for (const file of await app.files()) {
    if (ignore.includes(file.name)) continue;
    if (file.name === "package.json") {
      const pkg_json = await file.json() as any;
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
  for (const file of await app.dirs()) {
    if (ignore.includes(file.name)) continue;
    await file.copy(target.join(file.name));
  }
  await io.run("git add -A", { cwd: target.path });
  if (await has_changes(target.path)) {
    await io.run("git commit -m \"sync\"", { cwd: target.path });
    await io.run("git push --set-upstream origin master", { cwd: target.path });
    console.log(`✓ ${app.name}: changes pushed`);
  } else {
    console.log(`✓ ${app.name}: no changes`);
  }
}
