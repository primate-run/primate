import fs from "@rcompat/fs";

const packages = await (await fs.project.root()).join("packages").dirs();

// check all first
for (const pkg of packages) {
  const json = await pkg.join("package.json").json() as any;
  if (json.version.includes("-")) {
    console.error(`package ${json.name} already set to dev: ${json.version}`);
    break;
  }
  const [major] = json.version.split(".").map(Number);
  if (major > 0) {
    console.error("still in <1 phase, adapt script after 1.0");
    break;
  }
}

for (const pkg of packages) {
  const package_json = pkg.join("package.json");
  const json = await package_json.json() as any;
  const [major, minor] = json.version.split(".").map(Number);
  json.version = `${major}.${minor + 1}.0-pre`;
  await package_json.writeJSON(json);
}
