import { compileSync } from "@marko/compiler";
import fs from "@rcompat/fs";

function resolveVirtualDependency(_from, dep) {
  return dep.virtualPath;
}

function compile(text, path, output) {
  return compileSync(text, path, {
    output,
    resolveVirtualDependency,
  }).code;
}

const tags = fs.ref(import.meta.dirname).join("../src/private/tags");
const out = fs.ref(import.meta.dirname).join("../lib/private/tags");

const names = [];

for (const file of await tags.files()) {
  if (file.path.endsWith(".marko")) {
    const text = await file.text();
    const path = file.path;
    const base = file.debase(tags).path.slice(1, -".marko".length);

    await out.join(`${base}.browser.js`).write(compile(text, path, "dom"));
    await out.join(`${base}.server.js`).write(compile(text, path, "html"));
    names.push(base);
  }
}

await out.join("index.browser.js").write(
  names.map(n => `export { default as ${n} } from "./${n}.browser.js";`).join("\n")
);
await out.join("index.server.js").write(
  names.map(n => `export { default as ${n} } from "./${n}.server.js";`).join("\n")
);
