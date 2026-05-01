import runtime from "@rcompat/runtime";

const packages = await (await runtime.projectRoot()).join("packages").dirs();

// check all first
for (const pkg of packages) {
  const json = await pkg.join("package.json").json() as any;
  if (!json.version.includes("-")) {
    console.error(`package ${json.name} is not a dev version: ${json.version}`);
    break;
  }
}

for (const pkg of packages) {
  const package_json = pkg.join("package.json");
  const json = await package_json.json() as any;
  json.version = json.version.replace(/-.*$/, "");
  await package_json.writeJSON(json);
}
