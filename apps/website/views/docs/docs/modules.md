---
title: Writing modules
---

# Modules

Modules are the extension mechanism for Primate. They let you hook into the
application lifecycle — at build time, at startup, and on every request — to
add capabilities that are not part of the core framework.

All official `@primate/*` packages (frontends, databases, backends) are
themselves modules, and you can write your own using exactly the same API.

## The `Module` interface

A module is a plain object with two properties.

```ts
import type { Module } from "primate";

const myModule: Module = {
  name: "my-module",
  setup(hooks) {
    // register lifecycle hooks here
  },
};
```

| Property | Type | Description |
| -------- | ---- | ----------- |
| `name`   | `string` | unique identifier used in logs and error messages |
| `setup`  | `(hooks: Setup) => void` | called once at startup; use it to register hooks |

In practice, modules are usually exported as factory functions so they can
accept configuration:

```ts
import type { Module } from "primate";

type Options = {
  verbose?: boolean;
};

export default (options: Options = {}): Module => ({
  name: "my-module",
  setup(hooks) {
    // use options here
  },
});
```

Register the module in `config/app.ts`:

```ts
import config from "primate/config";
import myModule from "./my-module.ts";

export default config({
  modules: [myModule({ verbose: true })],
});
```

## Lifecycle hooks

The `setup` function receives a `Setup` object that exposes five hooks. Each
hook registers a callback that Primate calls at the corresponding point in
the application lifecycle.

| Hook | When it runs | Typical use |
| ---- | ------------ | ----------- |
| [`onInit`](#oninit) | Before anything else | validate config, set up external connections |
| [`onBuild`](#onbuild) | During the build step | register esbuild plugins, precompute assets |
| [`onServe`](#onserve) | When the HTTP server starts | capture server properties like `secure` |
| [`onHandle`](#onhandle) | On every incoming request | middleware — auth, headers, request context |
| [`onRoute`](#onroute) | After routing, before the handler | per-route pre/post processing |

### `onInit`

Called once during startup, before any other lifecycle phase. Use it to
validate options, establish database connections, or perform one-off
initialisation that the rest of the module depends on.

```ts
setup({ onInit }) {
  onInit(async app => {
    // app.path gives you access to project directories
    const config = await app.path.config.join("my-module.json").json();
    // throw here to abort startup on misconfiguration
  });
}
```

### `onBuild`

Called during the build step. Use it to register esbuild plugins, precompute
static assets, or write files into the build output.

```ts
setup({ onBuild }) {
  onBuild(async app => {
    // register a custom esbuild plugin for the client bundle
    app.plugin("client", {
      name: "my-loader",
      setup(build) {
        build.onLoad({ filter: /\.txt$/ }, async args => ({
          contents: await fs.readFile(args.path, "utf8"),
          loader: "text",
        }));
      },
    });

    // precompute a file into the run directory
    const data = await computeSomething();
    await app.runpath("my-module-data.json").writeJSON(data);
  });
}
```

### `onServe`

Called once when the HTTP server starts, after the build is complete. Use it
to capture runtime properties of the server, such as whether it is running
over HTTPS.

```ts
setup({ onServe }) {
  let secure = false;

  onServe(app => {
    secure = app.secure;
  });
}
```

### `onHandle`

Called on every incoming request, before routing. This is Primate's middleware
hook. Return a `Response` to short-circuit the request; call `next(request)` to
continue.

```ts
setup({ onHandle }) {
  onHandle((request, next) => {
    const token = request.headers.try("Authorization");
    if (token === undefined) {
      return new Response("Unauthorized", { status: 401 });
    }
    // pass a modified request downstream using request context
    return next(request.set("auth.token", token));
  });
}
```

The callback receives the same `RequestFacade` available in route handlers.
Attach derived values (authenticated user, feature flags, locale) with
`request.set()` so route handlers can read them with `request.get()`.

!!!
`onHandle` runs for every request, including static assets. Keep the callback
fast.
!!!

### `onRoute`

Called after routing resolves but before the route handler runs. Useful for
per-route pre- or post-processing.

```ts
setup({ onRoute }) {
  onRoute((request, next) => {
    // add a header to every response the app produces
    return next(request).then(response => {
      response.headers.set("X-Powered-By", "my-module");
      return response;
    });
  });
}
```

## A complete example

Here is a minimal logging module that measures response time and prints it to
the console.

```ts
import type { Module } from "primate";

export default (): Module => ({
  name: "request-logger",

  setup({ onHandle }) {
    onHandle(async (request, next) => {
      const start = Date.now();
      const response = await next(request);
      const ms = Date.now() - start;
      console.log(`${request.method} ${request.url.pathname} ${response.status} ${ms}ms`);
      return response;
    });
  },
});
```

Register it in `config/app.ts`:

```ts
import config from "primate/config";
import requestLogger from "./request-logger.ts";

export default config({
  modules: [requestLogger()],
});
```

## Sharing state between hooks

Because a module factory is a regular function, any variable declared inside
it is shared across all hooks for the lifetime of the application. This is the
standard way to pass data between, say, `onServe` and `onHandle`.

```ts
export default (): Module => {
  // shared across all hooks
  let apiKey = "";

  return {
    name: "my-module",
    setup({ onInit, onHandle }) {
      onInit(async app => {
        apiKey = await loadApiKey();
      });

      onHandle((request, next) => {
        return next(request.set("apiKey", apiKey));
      });
    },
  };
};
```
