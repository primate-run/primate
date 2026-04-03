---
title: Testing TypeScript monorepos without a build step with `@rcompat/test` and `proby`
epoch: 1775242664000
author: terrablue
---
Primate relies on rcompat, a JS standard library that unifies divergent runtime
APIs to ensure consistent behavior across Node, Deno, and Bun. rcompat is itself
a TypeScript monorepo with dozens of packages that depend on each other — which
means its test ergonomics matter a lot.

We have recently released new versions of `@rcompat/test` and `proby`, rcompat's
test runner, that fundamentally change how TypeScript monorepos can be tested.
The headline: **you no longer need a build step**. Not when changing test files,
not when changing implementation files, and not across package boundaries within
the monorepo. Edit any `.ts` file anywhere and the next `npx proby` run sees it
immediately.

## The build step problem

In a TypeScript monorepo, the typical test workflow looks like this:

1. Edit a source file in package A
2. Build package A
3. Run tests in package B, which depends on package A
4. Repeat

This is slow and error-prone. It's easy to forget a build, test against stale
output, and waste time chasing bugs that don't exist in the actual source.
Other test runners don't solve this, either requiring a build step or explicit
per-package configuration in their tooling.

## A pure TypeScript world

What we really want is to live entirely in TypeScript source — no compiled
output, no intermediate `.js` files cluttering the repo, no mental overhead of
"did I rebuild that?". Write `.ts`, run tests, see results. That's it.

With Node 24's native type stripping and proby reading your `tsconfig.json`'s
`customConditions`, that world is now real. Here's what it means in practice:

- **Change a `.spec.ts` file** — proby picks it up immediately. No rebuild.
- **Change an implementation file** — proby sees the new `.ts` source directly.
  No rebuild.
- **Change a file in package A that package B depends on** — package B's tests
  see the change immediately. No rebuild anywhere in the chain.

The entire monorepo runs from TypeScript source, all the way down.

The setup is two steps. First, add a custom condition to `compilerOptions.customConditions`
in your `tsconfig.json` — use a name scoped to your project to avoid conflicts
with other monorepos sharing `node_modules`:

```json
{
  "compilerOptions": {
    "customConditions": ["@primate/source"]
  }
}
```

proby reads this automatically and relaunches itself with
`--conditions=@primate/source`, so the condition activates for the entire test
run. And because TypeScript reads the same `customConditions`, your editor's
jump-to-source lands on the actual `.ts` file too — not compiled output. The
feedback loop between editing and testing collapses completely.

## How it works

Any package that opts in by adding a matching entry to its `package.json` will
have its imports resolved to `.ts` source files directly:

```json
{
  "exports": {
    ".": {
      "@primate/source": "./src/public/index.ts",
      "default": "./lib/public/index.js"
    }
  },
  "imports": {
    "#*": {
      "@primate/source": "./src/private/*.ts",
      "default": "./lib/private/*.js"
    }
  }
}
```

Because the condition applies process-wide, this works transparently across all
package boundaries in the monorepo with zero additional configuration.

**The opt-in is per package and entirely additive.** Packages without the
condition fall back to built output as normal. Once a package opts in, it
participates in the zero-rebuild chain automatically.

## A stricter feedback loop

Running from TypeScript source exposes a class of bugs that compiled output
silently hides. When the TypeScript compiler builds your `.js` files, it papers
over mismatches between type-only and value exports — the output just works. But
when Node executes your `.ts` files directly, those mismatches surface as real
runtime errors. `export type` versus `export` is no longer an academic
distinction — it has to be correct. Any type/runtime boundary bug that was
accidentally masked by the compiler will be caught the first time you run
`npx proby`.

## What's new

### `test.group`

Group related test cases together and run them selectively:

```ts
import test from "@rcompat/test";

test.group("addition", () => {
  test.case("integers", assert => {
    assert(1 + 1).equals(2);
  });

  test.case("floats", assert => {
    assert(0.1 + 0.2).equals(0.3);
  });
});
```

Run a specific group directly from the command line:

```bash
npx proby math.spec.ts addition
```

### `test.intercept`

Intercept outbound fetch calls to a specific origin and replace them with
controlled fake responses. Unmatched origins pass through to the real fetch
untouched:

```ts
import test from "@rcompat/test";

await using telegram = test.intercept("https://api.telegram.org", setup => {
  setup.post("/sendMessage", () => ({
    ok: true,
    result: { message_id: 42 },
  }));
});

test.case("notifies user on signup", async assert => {
  await myService.signup({ email: "foo@bar.com" });

  assert(telegram.calls("/sendMessage")).equals(1);
  assert(telegram.requests("/sendMessage")[0].method).equals("POST");
});
```

`await using` restores the original fetch automatically when the scope exits.
For long-lived intercepts, use `test.ended`:

```ts
const telegram = test.intercept("https://api.telegram.org", setup => {
  setup.post("/sendMessage", () => ({ ok: true, result: { message_id: 42 } }));
});

test.ended(() => telegram.restore());
```

### `test.mock` — dynamic

Mock ES module imports dynamically. `test.mock` registers a module interception
using Node's loader hooks and wraps exported functions in call trackers
automatically. Use `test.import` to import the module after mocks are registered:

```ts
import test from "@rcompat/test";

using math = test.mock("./math.ts", () => ({
  add: (a: number, b: number) => 99,
}));

const { myFunction } = await test.import("./my-function.ts");

test.case("uses mocked math", async assert => {
  const result = await myFunction();
  assert(result).equals(99);
  assert(math.add.called).true();
  assert(math.add.calls.length).equals(1);
});
```

Call counts reset automatically between test cases. `using` restores the
original module when the scope exits.

!!!
`test.mock` uses Node's module loader hooks, which are not yet available in
Deno or Bun. This feature is Node-exclusive for now.
!!!

### `test.mock` — static

For code that uses static top-level imports, dynamic mocking is too late —
the import is already resolved before any test code runs. proby solves this
with sibling mock files.

Add a `foo.mock.ts` alongside `foo.spec.ts` and proby loads it before the
spec, so the loader has the mock registered before any static import resolves:

```ts
// math.mock.ts
import test from "@rcompat/test";

test.mock("./math.ts", () => ({
  add: (a: number, b: number) => 99,
}));
```

```ts
// math.spec.ts
import test from "@rcompat/test";
import { add } from "./math.ts"; // static import — sees the mock

test.case("static mock is loaded before the spec", assert => {
  assert(add(1, 2)).equals(99);
});
```

Static mocks are file-scoped — they don't leak into other spec files.

### `test.extend`

Attach custom assertion methods to the asserter for domain-specific testing:

```ts
import test from "@rcompat/test";

const myTest = test.extend((assert, subject) => ({
  even() {
    assert(subject % 2 === 0).true();
    return this;
  },
}));

myTest.case("even numbers", assert => {
  assert(2).even();
  assert(4).even();
});
```

## Configuration

proby reads `customConditions` from your `tsconfig.json` automatically — no
separate proby configuration needed for the condition. For other options,
add a `proby.config.ts` to your project root:

```ts
import config from "proby/config";

export default config({
  monorepo: true,       // treat as monorepo (default: false)
  packages: "packages", // monorepo packages directory (default: "packages")
  include: ["src"],     // directories to scan for spec files (default: ["src"])
});
```

## Running tests

```bash
npx proby                        # run all tests
npx proby math.spec.ts           # run a single file
npx proby math.spec.ts addition  # run a single group within a file
```
