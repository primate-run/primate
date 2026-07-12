import core from "@primate/core";
import cli from "@rcompat/cli";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import is from "@rcompat/is";
import runtime_mod from "@rcompat/runtime";
import type { Dict } from "@rcompat/type";
import type Command from "./Command.js";

type Runtime = "node" | "deno" | "bun";

type Frontend =
  | "angular"
  | "eta"
  | "html"
  | "htmx"
  | "handlebars"
  | "markdown"
  | "marko"
  | "react"
  | "solid"
  | "svelte"
  | "voby"
  | "vue"
  | "webc";

const FRONTEND_OPTIONS: { label: string; value: Frontend }[] = [
  { label: "Angular", value: "angular" },
  { label: "Eta", value: "eta" },
  { label: "HTML", value: "html" },
  { label: "HTMX", value: "htmx" },
  { label: "Handlebars", value: "handlebars" },
  { label: "Markdown", value: "markdown" },
  { label: "Marko", value: "marko" },
  { label: "React", value: "react" },
  { label: "Solid", value: "solid" },
  { label: "Svelte", value: "svelte" },
  { label: "Voby", value: "voby" },
  { label: "Vue", value: "vue" },
  { label: "Web Components", value: "webc" },
];

type Backend = "go" | "python" | "ruby";

const BACKEND_OPTIONS: { label: string; value: Backend }[] = [
  { label: "Go", value: "go" },
  { label: "Python", value: "python" },
  { label: "Ruby", value: "ruby" },
];

type Database = "sqlite" | "postgresql" | "mysql" | "mongodb" | "oracledb";

const DATABASE_OPTIONS: { label: string; value: Database }[] = [
  { label: "SQLite", value: "sqlite" },
  { label: "PostgreSQL", value: "postgresql" },
  { label: "MySQL", value: "mysql" },
  { label: "MongoDB", value: "mongodb" },
  { label: "Oracle", value: "oracledb" },
];

// peer deps per frontend (npm names)
const FRONTEND_PEER_DEPS: Record<Frontend, string[]> = {
  angular: ["@angular/core", "@angular/common", "@angular/compiler"],
  eta: [],
  html: [],
  htmx: [],
  handlebars: [],
  markdown: [],
  marko: [],
  react: ["react", "react-dom"],
  solid: ["solid-js"],
  svelte: ["svelte"],
  voby: [],
  vue: ["vue"],
  "webc": [],
};

function abort() {
  return cli.prompt.cancel("Aborted");
}

function is_cancel(x: unknown) {
  return is.symbol(x) || prompt.isCancel(x);
}

const { prompt } = cli;

const command_init: Command = async () => {
  prompt.intro("Create a new Primate app");

  let directory: string;
  let target: FileRef;

  const log = core.logger(runtime_mod.flags.try("--log") ?? "warn");

  while (true) {
    const ans = await prompt.text({
      message: "Directory to create app?", initial: ".",
    });
    if (is.symbol(ans) || prompt.isCancel(ans)) return abort();

    target = fs.ref(ans);
    if (await empty(target)) {
      directory = ans;
      break; // valid directory found, exit loop
    }

    // directory not empty, show error but continue loop
    log.error("Directory not empty, choose another.");
  }

  const frontends = await prompt.multiselect<Frontend>({
    message: "Choose frontend (press Enter to skip)",
    options: FRONTEND_OPTIONS,
    initial: [],
  });
  if (is_cancel(frontends)) return abort();

  const backends = await prompt.multiselect<Backend>({
    message: "Choose backend (press Enter to skip)",
    options: BACKEND_OPTIONS,
    initial: [],
  });
  if (is_cancel(backends)) return abort();

  const runtime = await prompt.select<Runtime>({
    message: "Choose runtime",
    options: [
      { label: "Node", value: "node" },
      { label: "Deno", value: "deno" },
      { label: "Bun", value: "bun" },
    ],
    initial: 0,
  });
  if (is_cancel(runtime)) return abort();

  const dbs = await prompt.multiselect<Database>({
    message: "Choose a database (press Enter to skip)",
    options: DATABASE_OPTIONS,
    initial: [],
  });
  if (is_cancel(dbs)) return abort();

  const db = dbs[0] as Database | undefined;

  const i18n = await prompt.select<"yes" | "no">({
    message: "Enable i18n?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    initial: 1,
  });
  if (is_cancel(i18n)) return abort();

  const with_i18n = i18n === "yes";

  const sessions = await prompt.select<"yes" | "no">({
    message: "Configure sessions?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    initial: 1,
  });
  if (is_cancel(sessions)) return abort();
  const with_sessions = sessions === "yes";

  await target.create();
  await target.join("routes").create();
  await target.join("views").create();
  if (is.defined(db)) await target.join("stores").create();

  // files
  await gitignore(target);
  await tsconfig_json(target, { frontends });
  await app_config(target, { frontends, backends, runtime, with_i18n });
  if (with_sessions) await session_config(target);
  if (is.defined(db)) await database_config(target, db);
  await package_json(target, { directory, runtime: runtime });

  const packages = compute_packages({ frontends, backends, db });
  const install = build_install_command(runtime, packages, directory);

  prompt.outro(`${cli.fg.green("done, now run")} ${cli.fg.dim(install.print)}`);

  process.exit();
};

async function empty(directory: FileRef) {
  try {
    if (!(await directory.exists())) return true;
    const entries = await directory.list();
    return entries.length === 0;
  } catch {
    return false;
  }
}

async function gitignore(root: FileRef) {
  const gi = root.join(".gitignore");
  await gi.directory.create();
  const content = [
    "node_modules",
    "build",
    "*.log",
    "",
  ].join("\n");
  await gi.write(content);
}

type AppChoices = {
  frontends: Frontend[];
  backends: Backend[];
  runtime: Runtime;
  with_i18n: boolean;
};

function app_config_imports(choices: AppChoices) {
  const config = `import config from "primate/config";`;
  const frontend = choices.frontends.length > 0
    ? choices.frontends
      .map(i => `import ${to_ident(i)} from "@primate/${i}";`)
      .join("\n")
    : false;
  const backend = choices.backends.length > 0
    ? choices.backends
      .map(i => `import ${to_ident(i)} from "@primate/${i}";`)
      .join("\n")
    : false;
  const i18n = choices.with_i18n
    ? `import en from "../locales/en-US.ts";`
    : false;
  return [config, frontend, backend, i18n, "\n"].filter(Boolean).join("\n");
}

function app_config_export(choices: AppChoices) {
  const modules = [
    ...choices.frontends.map((f) => `${to_ident(f)}()`),
    ...choices.backends.map((b) => `${to_ident(b)}()`),
  ];

  const i18n = choices.with_i18n
    ? `  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": en,
    },
  },\n`
    : "";

  return `export default config({
${i18n}  modules: [
    ${modules.join(",\n    ")},
  ],
});`;
}

async function app_config(root: FileRef, choices: AppChoices) {
  const config = root.join("config").join("app.ts");
  await config.directory.create();

  if (choices.with_i18n) {
    const locale = root.join("locales").join("en-US.ts");
    await locale.directory.create();
    await locale.write(`import i18n from "primate/i18n";

export default i18n.locale({
  hi: "Hi",
  placeheld: "Hello, {name}",
});`);
  }

  await config.write(app_config_imports(choices) + app_config_export(choices));
}

async function session_config(root: FileRef) {
  const file = root.join("config").join("session.ts");
  await file.directory.create();
  const body = `import session from "primate/session";
export default session({}); `;
  await file.write(body);
}

async function database_config(root: FileRef, db: Database) {
  const file = root.join("config").join("db.ts");
  await file.directory.create();

  const ident = to_ident(db);
  const body = `import ${ident} from "@primate/${db}";
export default ${ident} (); `;
  await file.write(body);
}

async function package_json(
  root: FileRef,
  c: { directory: string; runtime: Runtime },
) {
  const pkgFile = root.join("package.json");

  type PKG = {
    name: string;
    type: "module";
    scripts: Dict<string>;
  };
  const pkg: PKG = {
    name: safe(c.directory),
    type: "module",
    scripts: {},
  };

  if (c.runtime === "deno") {
    pkg.scripts.start = "deno run -A npm:primate";
    pkg.scripts.build = "deno run -A npm:primate build";
    pkg.scripts.serve = "deno run -A npm:primate serve";
    pkg.scripts.dev = "deno task start";
  } else if (c.runtime === "bun") {
    pkg.scripts.start = "bunx --bun primate";
    pkg.scripts.build = "bunx --bun primate build";
    pkg.scripts.serve = "bunx --bun primate serve";
    pkg.scripts.dev = "bun run start";
  } else {
    pkg.scripts.start = "npx primate";
    pkg.scripts.build = "npx primate build";
    pkg.scripts.serve = "npx primate serve";
    pkg.scripts.dev = "npm run start";
  }

  await pkgFile.writeJSON(pkg);
}

function safe(s: string) {
  return s
    .trim()
    .toLowerCase().replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "") || "primate-app";
}

function to_ident(token: string) {
  return token.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function compute_packages(args: {
  frontends: Frontend[];
  backends: Backend[];
  db: Database | undefined;
}) {
  const deps = new Set<string>();
  const dev_deps = new Set<string>();

  deps.add("primate");
  // Always add TypeScript as dev dependency
  dev_deps.add("typescript");

  // frontends → @primate/<token> (+ peer deps)
  for (const f of args.frontends) {
    deps.add(`@primate/${f}`);
    const extras = FRONTEND_PEER_DEPS[f] || [];
    for (const extra of extras) deps.add(extra);
  }

  // backends → @primate/<token>
  for (const b of args.backends) deps.add(`@primate/${b}`);

  // database → @primate/<token>, if selected
  if (is.defined(args.db)) deps.add(`@primate/${args.db}`);

  return {
    dependencies: Array.from(deps),
    dev_dependencies: Array.from(dev_deps),
  };
}

function sh_quote(p: string) {
  // POSIX shell-safe quoting
  return `'${p.replace(/'/g, "'\\''")}'`;
}

function build_install_command(runtime: Runtime, packages: {
  dependencies: string[]; dev_dependencies: string[];
}, dir: string) {
  const { dependencies, dev_dependencies } = packages;
  const all_pkgs = [...dependencies, ...dev_dependencies];

  if (all_pkgs.length === 0) {
    return { print: "No packages to install.", run: "" };
  }

  const cd = dir === "." ? "" : `cd ${sh_quote(dir)} && `;
  if (runtime === "bun") {
    const dep_cmd = dependencies.length > 0
      ? `bun add ${dependencies.join(" ")}`
      : "";
    const dev_cmd = dev_dependencies.length > 0
      ? `bun add -d ${dev_dependencies.join(" ")}`
      : "";
    const commands = [dep_cmd, dev_cmd].filter(Boolean);
    return { print: cd + commands.join(" && "), run: "" };
  }
  if (runtime === "deno") {
    const dep_cmd = dependencies.length > 0
      ? `deno add ${dependencies.map(d => `npm:${d}`).join(" ")}`
      : "";
    const dev_cmd = dev_dependencies.length > 0
      ? `deno add -D ${dev_dependencies.map(d => `npm:${d}`).join(" ")}`
      : "";
    const commands = [dep_cmd, dev_cmd].filter(Boolean);
    return { print: cd + commands.join(" && "), run: "" };
  }
  const dep_cmd = dependencies.length > 0 ?
    `npm install ${dependencies.join(" ")}`
    : "";
  const dev_cmd = dev_dependencies.length > 0
    ? `npm install -D ${dev_dependencies.join(" ")}`
    : "";
  const commands = [dep_cmd, dev_cmd].filter(Boolean);
  return { print: cd + commands.join(" && "), run: "" };
}

async function tsconfig_json(root: FileRef, opts: { frontends: Frontend[] }) {
  const is_react = opts.frontends.includes("react");
  const ts_config: any = {
    extends: "primate/tsconfig",
    compilerOptions: {
      baseUrl: "${configDir}",
      paths: {
        "@/*": ["*"],
      },
    },
    include: [
      "client",
      "config",
      "views",
      "components",
      "routes",
      "stores",
      "locales",
      "templates",
      "static",
    ],
    exclude: ["node_modules"],
  };
  if (is_react) ts_config.compilerOptions.jsx = "react-jsx";

  await root.join("tsconfig.json").writeJSON(ts_config);
}

export default command_init;
