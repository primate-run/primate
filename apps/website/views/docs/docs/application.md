---
title: Application
---

# Application

Primate exposes an **application facade** through `config/app.ts`. It provides
app-level utilities that are useful from server code, especially in route
handlers.

Use it when you need access to:
* configuration values
* environment variables
* the project root
* server-side views

## Importing the application facade

The application facade is the default export of `config/app.ts`.

You can import it directly:

```ts
import app from "../config/app.ts";
```

or, if you have configured a path alias in `tsconfig.json`, via the alias:

```ts
import app from "#app";
```

A typical route might look like this:

```ts
import app from "#app";
import response from "primate/response";
import route from "primate/route";
import Page from "#view/Page";

export default route({
  get() {
      const title = app.config("name");
    
      return response.view(Page, { title });
  },
});
```

!!!
`#app` and `#view/*` are path aliases, not built-in language features. They
only work if you configure them in `tsconfig.json`, for example by mapping
`#app` to `config/app.ts` and `#view/*` to `views/*`.
!!!

## `app.config(path)`

Read values from your app configuration using a dot-separated path:

```ts
const name = app.config("name");
const secure = app.config("server.secure");
```

This is useful when route handlers or other server-side code need to react to
application settings without importing configuration files directly.

## `app.env(key)`

Read environment variables through the application facade:

```ts
const token = app.env("API_TOKEN");
```

This gives you a single app-level API for environment access instead of calling
runtime-specific APIs directly.

### Typed environment variables

You can make `app.env()` type-safe by declaring an environment schema in
`config/app.ts`:

```ts
// config/app.ts
import config from "primate/config";
import p from "pema";

export default config({
  env: {
    schema: p({
      API_TOKEN: p.string,
      PORT: p.u16,
    }),
  },
});
```

With a schema in place, Primate validates environment variables when the app
starts serving, and `app.env()` becomes typed:

```ts
const token = app.env("API_TOKEN"); // string
const port = app.env("PORT");       // number
```

If a required key is missing, or a value does not satisfy the schema, Primate
fails early instead of letting misconfiguration surface later at runtime.

If no `env.schema` is configured, `app.env()` reads from the environment
directly.

!!!
`app.env()` is server-only. Do not use it in frontend code.
!!!

## `app.view(name)`

Load a server-side view by name:

```ts
const page = app.view("docs/home/index.md");
```

This is mainly useful in advanced cases where you need the rendered or parsed
view result before passing it somewhere else.

For ordinary page rendering, prefer returning `response.view(...)` directly.
Use `app.view(...)` only when you need to load a view manually and work with
its result before returning a response.

```ts
import app from "#app";
import response from "primate/response";
import route from "primate/route";
import Page from "#view/Page";

export default route({
  get() {
      const { html } = app.view("docs/home/index.md");
      return response.view(Page, { content: html });
  },
});
```

## `app.root`

`app.root` is a `FileRef` pointing at your project root.

Use it to access app files relative to the root directory:

```ts
const guides = await app.root.join("guides.json").json();
```

This is useful for reading local assets, generated files, or project metadata
without hard-coding absolute paths.

## Summary

| API                | Description                            |
| ------------------ | -------------------------------------- |
| `app.config(path)` | Read app configuration values          |
| `app.env(key)`     | Read environment variables             |
| `app.view(name)`   | Load a server-side view                |
| `app.root`         | Access the project root as a `FileRef` |


In most apps, you will use the application facade from route handlers when you
need information or utilities that belong to the application as a whole rather
than to the current request.
