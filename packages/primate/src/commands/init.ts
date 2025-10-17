import cancel from "@rcompat/cli/prompts/cancel";
import intro from "@rcompat/cli/prompts/intro";
import isCancel from "@rcompat/cli/prompts/is-cancel";
import multiselect from "@rcompat/cli/prompts/multiselect";
import outro from "@rcompat/cli/prompts/outro";
import select from "@rcompat/cli/prompts/select";
import text from "@rcompat/cli/prompts/text";
import FileRef from "@rcompat/fs/FileRef";
import dedent from "@rcompat/string/dedent";
import type Dict from "@rcompat/type/Dict";

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

// Backends (TypeScript is always active/built-in → not a choice)
type Backend = "go" | "python" | "ruby" | "grain";

const BACKEND_OPTIONS: { label: string; value: Backend }[] = [
  { label: "Go", value: "go" },
  { label: "Python", value: "python" },
  { label: "Ruby", value: "ruby" },
  { label: "Grain", value: "grain" },
];

// Databases (use multiselect too; Enter = skip)
type Database = "sqlite" | "postgresql" | "mysql" | "mongodb" | "surrealdb";

const DATABASE_OPTIONS: { label: string; value: Database }[] = [
  { label: "SQLite", value: "sqlite" },
  { label: "PostgreSQL", value: "postgresql" },
  { label: "MySQL", value: "mysql" },
  { label: "MongoDB", value: "mongodb" },
  { label: "SurrealDB", value: "surrealdb" },
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

export default async function init() {
  intro("Create a new Primate app");

  let directory: string;
  let target: FileRef;

  while (true) {
    const ans = await text({ message: "Directory to create app?", initial: "." });
    if (typeof ans === "symbol" || isCancel(ans)) return cancel("Aborted.");

    target = new FileRef(ans);
    if (await empty(target)) {
      directory = ans;
      break; // Valid directory found, exit loop
    }

    // Directory not empty, show error but continue loop
    console.log("Directory not empty, choose another.");
  }

  // frontends — Enter = skip (none)
  const fronts = await multiselect<Frontend>({
    message: "Choose frontend (press Enter to skip)",
    options: FRONTEND_OPTIONS,
    initial: [], // indices
  });
  if (typeof fronts === "symbol" || isCancel(fronts)) return cancel("Aborted.");

  // backends — Enter = skip (none)
  const backs = await multiselect<Backend>({
    message: "Choose backend (press Enter to skip)",
    options: BACKEND_OPTIONS,
    initial: [], // indices
  });
  if (typeof backs === "symbol" || isCancel(backs)) return cancel("Aborted.");

  // runtime (must choose one)
  const runtime = await select<Runtime>({
    message: "Choose runtime",
    options: [
      { label: "Node", value: "node" },
      { label: "Deno", value: "deno" },
      { label: "Bun", value: "bun" },
    ],
    initial: 0,
  });
  if (typeof runtime === "symbol" || isCancel(runtime)) return cancel("Aborted.");

  // database — Enter = skip (none); if multiple chosen, take the first
  const dbChoices = await multiselect<Database>({
    message: "Choose a database (press Enter to skip)",
    options: DATABASE_OPTIONS,
    initial: [], // indices
  });
  if (typeof dbChoices === "symbol" || isCancel(dbChoices)) return cancel("Aborted.");
  const db: Database | undefined = dbChoices[0];

  // i18n
  const i18n = await select<"yes" | "no">({
    message: "Enable i18n?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    initial: 1,
  });
  if (typeof i18n === "symbol" || isCancel(i18n)) return cancel("Aborted.");
  const withI18n = i18n === "yes";

  // sessions
  const sessions = await select<"yes" | "no">({
    message: "Configure sessions?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    initial: 1,
  });
  if (typeof sessions === "symbol" || isCancel(sessions)) return cancel("Aborted.");
  const withSessions = sessions === "yes";

  // scaffold dirs
  await target.create({ recursive: true });
  await target.join("routes").create({ recursive: true });
  await target.join("views").create({ recursive: true });
  if (db) await target.join("stores").create({ recursive: true });

  // files
  await gitignore(target);
  await tsconfig_json(target);
  await app_config(target, { fronts, backs, runtime });
  if (withI18n) await i18n_config(target);
  if (withSessions) await session_config(target);
  if (db) await database_config(target, db);
  await package_json(target, { directory, runtime });

  const packages = compute_packages({ fronts, backs, db });
  const install = buildInstallCommand(runtime, packages, directory);

  outro(
    [
      "Done, now run",
      `\n  ${install.print}`,
    ].join("\n"),
  );

  process.exit();
}

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
  await gi.directory.create({ recursive: true });
  const content = [
    "node_modules",
    "build",
    "dist",
    ".DS_Store",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*",
    "",
  ].join("\n");
  await gi.write(content);
}

type AppChoices = {
  fronts: Frontend[];
  backs: Backend[];
  runtime: Runtime;
};

async function app_config(root: FileRef, c: AppChoices) {
  const cfg = root.join("config").join("app.ts");
  await cfg.directory.create({ recursive: true });

  const frontendImports = c.fronts
    .map((f) => `import ${toIdent(f)} from "@primate/${f}";`)
    .join("\n");
  const backendImports = c.backs
    .map((b) => `import ${toIdent(b)} from "@primate/${b}";`)
    .join("\n");

  const modules = [
    ...c.fronts.map((f) => `${toIdent(f)}()`),
    ...c.backs.map((b) => `${toIdent(b)}()`),
  ];

  const body = dedent`import config from "primate/config";
${frontendImports}
${backendImports}

export default config({
  modules: [
    ${modules.join(",\n    ")}
  ],
});
`;
  await cfg.write(body);
}

// i18n scaffold: config + a default locale file
async function i18n_config(root: FileRef) {
  const locales = root.join("locales");
  const en_us = locales.join("en-US.ts");
  const i18i = root.join("config").join("i18n.ts");

  await en_us.directory.create({ recursive: true });
  await i18i.directory.create({ recursive: true });

  const locale = `import locale from "primate/i18n/locale";

export default locale({
  hi: "Hello",
  placeheld: "Hello, {name}",
});
`;
  await en_us.write(locale);

  const config = `import en from "#locale/en-US";
import i18n from "primate/config/i18n";

export default i18n({
  defaultLocale: "en-US",
  locales: {
    "en-US": en,
  },
});
`;
  await i18i.write(config);
}

async function session_config(root: FileRef) {
  const file = root.join("config").join("session.ts");
  await file.directory.create({ recursive: true });
  const body = `import session from "primate/config/session";

export default session({});
`;
  await file.write(body);
}

async function database_config(root: FileRef, db: Database) {
  const file = root.join("config").join("database").join("index.ts");
  await file.directory.create({ recursive: true });

  const ident = toIdent(db);
  const body = `import ${ident} from "@primate/${db}";

export default ${ident}();
`;
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
  return s.trim().toLowerCase().replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "") || "primate-app";
}

function toIdent(token: string) {
  // turn tokens like "web-components" into valid identifiers: "web_components"
  return token.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function compute_packages(args: { fronts: Frontend[]; backs: Backend[]; db: Database | undefined }) {
  const deps = new Set<string>();
  const devDeps = new Set<string>();

  deps.add("primate");
  // Always add TypeScript as dev dependency
  devDeps.add("typescript");

  // frontends → @primate/<token> (+ peer deps)
  for (const f of args.fronts) {
    deps.add(`@primate/${f}`);
    const extras = FRONTEND_PEER_DEPS[f] || [];
    for (const extra of extras) deps.add(extra);
  }

  // backends → @primate/<token>
  for (const b of args.backs) {
    deps.add(`@primate/${b}`);
  }

  // database → @primate/<token>, if selected
  if (args.db) deps.add(`@primate/${args.db}`);

  return {
    dependencies: Array.from(deps),
    devDependencies: Array.from(devDeps),
  };
}

function shQuote(p: string) {
  // POSIX shell-safe quoting
  return `'${p.replace(/'/g, "'\\''")}'`;
}

function buildInstallCommand(runtime: Runtime, packages: { dependencies: string[]; devDependencies: string[] }, dir: string) {
  const { dependencies, devDependencies } = packages;
  const allPkgs = [...dependencies, ...devDependencies];

  if (allPkgs.length === 0) {
    return { print: "No packages to install.", run: "" };
  }

  const cd = `cd ${shQuote(dir)} && `;
  if (runtime === "bun") {
    const depCmd = dependencies.length > 0
      ? `bun add ${dependencies.join(" ")}`
      : "";
    const devCmd = devDependencies.length > 0
      ? `bun add -d ${devDependencies.join(" ")}`
      : "";
    const commands = [depCmd, devCmd].filter(Boolean);
    return { print: cd + commands.join(" && "), run: "" };
  }
  if (runtime === "deno") {
    const depCmd = dependencies.length > 0
      ? `deno add ${dependencies.map(d => `npm:${d}`).join(" ")}`
      : "";
    const devCmd = devDependencies.length > 0
      ? `deno add -D ${devDependencies.map(d => `npm:${d}`).join(" ")}`
      : "";
    const commands = [depCmd, devCmd].filter(Boolean);
    return { print: cd + commands.join(" && "), run: "" };
  }
  const depCmd = dependencies.length > 0 ?
    `npm install ${dependencies.join(" ")}`
    : "";
  const devCmd = devDependencies.length > 0
    ? `npm install -D ${devDependencies.join(" ")}`
    : "";
  const commands = [depCmd, devCmd].filter(Boolean);
  return { print: cd + commands.join(" && "), run: "" };
}

async function tsconfig_json(root: FileRef) {
  await root.join("tsconfig.json").writeJSON({
    extends: "primate/tsconfig",
  });
}
