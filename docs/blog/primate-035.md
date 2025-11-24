---
title: Primate 0.35: Server hot reload, standalone builds, server-client type safety
epoch: 1763984643000
author: terrablue
---

Today we're announcing the availability of the Primate 0.35 preview release.
This release introduces server hot reload for all backend modules including
WebAssembly, standalone production builds, server-client type safety, and a
completely redesigned build system that eliminates previous complexity.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get
started.
!!!

## Redesigned build system

Primate 0.35 fundamentally changes how the framework handles builds. Instead of
copying files to the `build` directory and running them from there, Primate now
bundles your server code into a single file that enables hot reloading during
development and creates standalone executables for production.

### Benefits of the new architecture

The new build system provides several key advantages:

- **Faster development**: Hot reload works for all backend code, including
  WebAssembly
- **Simpler deployment**: Production builds are self-contained with no external
  dependencies
- **Better performance**: Bundled code eliminates filesystem overhead during
  runtime
- **Cleaner code**: Direct esbuild integration replaces abstraction layers

### Customizable build directory

You can now specify a different build output location using the `--dir` flag:

```bash
npx primate build --dir out
npx primate serve --dir out
```

This is particularly useful for deployment pipelines or when integrating with
other tools.

## Server hot reload

Primate now supports server hot reloading when modifying backend code during
development. Whether your routes are written in TypeScript, JavaScript, or any
supported WebAssembly language, Primate will reload your changes instantly
without restarting the runtime process.

During development, the generated server bundle only contains routes and stores,
keeping it lightweight. Each change triggers a fast regeneration and reimport
cycle, providing a development experience on par with client-side hot reload.

### How it works

When you modify a route file:

1. Primate detects the change via filesystem watching
2. The server bundle is regenerated (typically under 100ms)
3. The new bundle is imported without restarting the runtime process
4. Your browser automatically refreshes to reflect the changes

This works seamlessly across all supported backend languages, including Go,
Python, and Ruby.

## Server-client type safety

One of the most significant improvements in 0.35 is full type safety between
your server routes and client views. Previously, when using `response.view`,
you had to pass view names as strings, making it difficult to ensure props had
the correct shape and type.

In 0.35, you can now directly import view components and use them with
`response.view`. TypeScript will verify that the props you pass match what the
component expects.

### Type-safe views

**Before (0.34):**

```ts
// routes/user.ts
import route from "primate/route";

route.get(request => {
  // string-based, no type checking
  return response.view("UserProfile.tsx", {
    name: "Bob",
    age: 30,
    // typos or wrong types go unnoticed
  });
});
```

**After (0.35):**

```ts
// routes/user.ts
import route from "primate/route";
import UserProfile from "#view/UserProfile";

route.get(request => {
  // direct import, fully type-checked
  return response.view(UserProfile, {
    name: "Bob",
    age: 30,
    // TypeScript will error if props don't match component signature
  });
});
```

### Full type inference

The view component's prop types are automatically inferred:

```tsx
// views/UserProfile.tsx
export default function UserProfile({ name, age }: {
  name: string;
  age: number;
}) {
  return (
    <div>
      <h1>{name}</h1>
      <p>Age: {age}</p>
    </div>
  );
}
```

Now in your route:

```ts
import UserProfile from "#view/UserProfile";

route.get(() => {
  return response.view(UserProfile, {
    name: "Bob",
    age: "thirty", // TypeScript error: Type 'string' is not assignable
  });              // to type 'number'
});
```

### Benefits

- **Catch errors early**: Type mismatches are caught during development, not
  at runtime
- **Better IDE support**: Full autocomplete for prop names and types
- **Refactoring safety**: Changing a component's props automatically updates
  all usage sites
- **Self-documenting code**: Component signatures serve as documentation

!!!
For Svelte server-client type safety, you will need to install the Primate
Svelte language server plugin for TypeScript, `@plsp/svelte`, and activate it
in your `tsconfig.json`.
!!!

Server-client type safety is currently only supported for JSX frontends (React,
Solid, Voby) and Svelte. Support for Vue and Angular will be added in a future
release.
!!!

## Standalone production builds

Production builds now generate a single `build/server.js` file that bundles all
dependencies, static assets, routes, stores, and views. This file can be
executed directly:

```bash
node build/server.js
```

No `node_modules`, no `npm install`, no build step required on the production
server. Everything needed to run your application is contained in one file.

### What gets bundled

- All npm dependencies
- Your application code (routes, stores, views)
- Static assets (images, fonts, etc.) as base64-encoded data
- Configuration files
- Compiled WebAssembly modules

!!!
Python and Ruby backends currently still require `node_modules` due to their
native dependencies. Full standalone support for these languages is planned for
later versions.
!!!

## Enhanced plugin system

The previous `config.build` option has been replaced with a more powerful
plugin API. You can now register esbuild plugins directly for both client and
server builds:

```ts
import type BuildApp from "primate/BuildApp";
import type { Plugin } from "esbuild";
import Module from "@primate/core/Module";

export default new class extends Module {
  name: "custom-module",
  build(app: BuildApp, next) {
    // add a client-side plugin
    app.plugin("client", {
      name: "custom/client/plugin",
      setup(build) {
        // plugin code
      },
    });

    // add a server-side plugin
    app.plugin("server", {
      name: "custom/server/plugin",
      setup(build) {
        // plugin code
      },
    });

    return next(app);
  }
}
```

This provides full control over the build process for both frontend and backend
compilation.

## Breaking changes

### `tsconfig.json` paths no longer required

Primate no longer provides specific `paths` or `include` configurations in
`tsconfig.json`. You can now organize your project however you prefer. We still
recommend extending `primate/tsconfig` for sensible defaults:

```json
{
  "extends": "primate/tsconfig",
  "compilerOptions": {
    "paths": {
      "#view/*": ["views/*"],
      "#store/*": ["stores/*"],
      "#config/*": ["config/*"]
    }
  },
  "include": [
    "config",
    "routes",
    "views",
    "stores"
  ]
}
```

### Session configuration simplified

Sessions now use Primate stores for both persistence and validation,
eliminating the need for separate managers and schemas.

**Create a session store:**

```ts
// stores/Session.ts
import p from "pema";
import store from "primate/store";

export default store({
  id: p.primary,
  session_id: p.string.uuid(),
  user_id: p.number,
  last_active: p.date,
});
```

**Configure sessions:**

```ts
// config/session.ts
import Session from "#store/Session";
import session from "primate/session/config";

export default session({
  store: Session,
  cookie: { name: "session" }
});
```

**Use in routes:**

```ts
import session from "#session";
import route from "primate/route";

route.get(() => {
  if (!session.exists) {
    session.create({ user_id: 42 });
  }

  const data = session.get();
  return `User ${data.user_id} last active at ${data.last_active}`;
});
```

## What's next

Check out our issue tracker for upcoming [0.36 features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[0.36 features]: https://github.com/primate-run/primate/milestone/7
