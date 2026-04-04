---
title: Primate 0.37: Revised modules, database migrations, typed environment access and ZZZ
epoch: 0
author: terrablue
---

Today we're announcing the availability of the Primate 0.37 preview release.
This release revises the module system, adds database migrations, introduces
typed environment access, and ZZZ.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## Revised module system

Primate modules have always been the extension mechanism for the framework —
every official `@primate/*` package is itself a module. In 0.37 we've
simplified the API considerably.

Previously, a module was an abstract class. It is now a plain object (or a
factory function returning one) with two properties: a `name` string and a
`setup` function that receives the lifecycle hooks.

```ts
import type { Module } from "primate";

export default (): Module => ({
  name: "my-module",
  setup({ onBuild, onServe, onHandle }) {
    onServe(app => {
      console.log(`my-module active, secure: ${app.secure}`);
    });
  },
});
```

The five hooks — `onInit`, `onBuild`, `onServe`, `onHandle`, and `onRoute` —
are unchanged in what they do. Only the way you register them has changed:
instead of overriding methods on a class, you call the hook registrars passed
into `setup`.

State that used to live as class fields now lives as plain variables in the
factory function's closure, shared naturally across all hooks.

```ts
export default (): Module => {
  let secure = false;

  return {
    name: "my-module",
    setup({ onServe, onHandle }) {
      onServe(app => {
        secure = app.secure;
      });

      onHandle((request, next) => {
        return next(request.set("secure", secure));
      });
    },
  };
};
```

See the new [modules] page in the docs for a full reference.

## Database migrations

Primate 0.37 adds an opt-in migration system for store-backed schemas.

Once enabled, Primate can compare your current stores to the live database,
generate numbered migration files into `migrations/`, and apply them in order.
That keeps schema changes explicit and reviewable without forcing you to
hand-write every migration from scratch.

Enable it in `config/app.ts` by telling Primate which database should track
applied migrations and which table to use:

```ts
import config from "primate/config";
import db from "./db/index.ts";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
    },
  },
});
```

Migrations are entirely opt-in. If you do not configure `db.migrations`,
Primate behaves as before.

Once configured, the workflow is:

```bash
npx primate migrate:create --name="add posts"
npx primate migrate:status
npx primate migrate:apply
```

`migrate:create` inspects the current database schema, compares it to your
stores, and writes a new numbered migration file. It handles both new tables
and table alterations, and when a change looks like a rename rather than a
drop-and-add, Primate will ask you to confirm it.

`migrate:status` shows which migrations have already been applied and which are
still pending. `migrate:apply` runs pending migrations in order and records
them in the migration table.

Primate is deliberately strict here. If you have generated migrations that
have not yet been applied, it will refuse to generate another one on top. And
when serving a built app, Primate now checks that the database is up to date
with the migration version captured at build time and errors on startup if it
is not. In practice, that means unapplied migrations fail fast instead of
surfacing later as confusing runtime schema errors.

!!!
As part of this change, build metadata now uses `build.json` instead of
`.primate` in the build directory. If you are upgrading an existing app, remove
your current build directory once before rebuilding.
!!!

## Typed environment access

Primate 0.37 adds `AppFacade#env(key)`, a small but important improvement for
server-side configuration.

Until now, reading environment variables usually meant reaching for
`Deno.env.get()`, `process.env`, or another runtime-specific API directly. In
0.37, Primate exposes a single app-level `env()` method instead:

```ts
import app from "../config/app.ts";
const token = app.env("API_TOKEN");
```

You can also make environment access fully typed by declaring a schema in
`config/app.ts`:

```ts
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

With a schema in place, Primate parses and validates environment variables at
startup, and `app.env()` becomes type-aware:

```ts
const token = app.env("API_TOKEN"); // string
const port = app.env("PORT");       // number
```

If a required key is missing, or a value fails schema validation, Primate
errors immediately instead of letting misconfiguration surface later at
runtime.

`app.env()` is server-only. It is available through the app facade in backend
code, and intentionally throws if used in frontend bundles.

## `app:FRONTEND` and deprecation of magical request props

Until now, Primate injected a `request` prop into every component
automatically — a convenience that turned out to cause more confusion than it
solved, particularly around typing and tree-shaking.

In 0.37, each reactive frontend ships its own `app:FRONTEND` virtual module
that exposes the current request as a native reactive primitive. You opt in
explicitly, import only what you need, and get full type safety.

The primitive matches the frontend's own reactivity model:

**Svelte** — a writable store, subscribe with `$`:

```svelte
<script lang="ts">
  import { request } from "app:svelte";
</script>

<p>{$request.url.pathname}</p>
```

**React** — a hook backed by `useSyncExternalStore`:

```tsx
import { useRequest } from "app:react";

export default function Page() {
  const request = useRequest();
  return <p>{request.url.pathname}</p>;
}
```

**Vue** — a composable returning a `ref`:

```vue
<script lang="ts" setup>
  import { useRequest } from "app:vue";
  const request = useRequest();
</script>

<template><p>{{ request.url.pathname }}</p></template>
```

**Angular** — a signal assigned to a class property:

```ts
import { Component } from "@angular/core";
import { request } from "app:angular";

@Component({ template: `<p>{{ request().url.pathname }}</p>` })
export default class Page {
  request = request;
}
```

**Solid** — a signal called directly:

```tsx
import { request } from "app:solid";

export default function Page() {
  return <p>{request().url.pathname}</p>;
}
```

In all cases the value is a `RequestPublic` object — a lightweight snapshot of
the current request with `url`, `query`, `headers`, and `cookies` as plain
`Dict<string>` records. It updates automatically on every client-side
navigation.

The old magical `request` prop was removed in this release.

## Explicit, portable stores

Primate stores previously relied on runtime magic to fill in two pieces of
information: the store's `name` (derived from the filename) and its `db`
(inferred from the app's default database). This was convenient inside a
running Primate app, but it meant stores were not self-contained — importing
one outside of the framework context could silently fail or behave differently.

In 0.37, both `name` and `db` are required, and the `schema` field moves
inside the single options object:

```ts
// stores/Post.ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import db from "../config/db/index.ts";

export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string.max(100),
    body: p.string,
    created: p.date.default(() => new Date()),
  },
});
```

Passing an incorrect or missing `name`, `db`, or `schema` now throws
immediately at construction time.

The payoff is portability. A store file is now a plain module that works
anywhere — migration scripts, test suites, REPLs, or any other context outside
a running Primate app:

```ts
// scripts/migrate.ts
import Post from "../stores/Post.ts";

await Post.table.create();
```

No framework initialisation required. See the updated [stores] page for the
full reference.

### Migrating

Change the `store()` call in each of your store files from the old two-argument
form to the new single-object form, and add explicit `name` and `db` fields:

```ts
// before
export default store(
  { id: key.primary(p.u32), title: p.string },
  { db, name: "post" },
);

// after
export default store({
  name: "post",
  db,
  schema: { id: key.primary(p.u32), title: p.string },
});
```

## `p.uuid` and first-class UUID primary keys

Primate 0.37 introduces `p.uuid` as a first-class Pema type, replacing the
implicit use of `p.string` for UUID primary keys.

### The new type

`p.uuid` and its variants are fully storable types with their own datatypes:

```ts
import p from "pema";

p.uuid      // any valid UUID, generates v7 by default
p.uuid.v4() // strict RFC 4122 v4
p.uuid.v7() // strict RFC 9562 v7
```

All three validate UUID format on parse. `p.uuid.v4()` and `p.uuid.v7()`
additionally enforce the version digit.

### Native storage per driver

Each driver stores UUIDs in its most efficient native format:

| Driver     | Storage         |
| ---------- | --------------- |
| PostgreSQL | `UUID`          |
| MySQL      | `BINARY(16)`    |
| SQLite     | `TEXT`          |
| MongoDB    | `BinData(4)`    |

Bind and unbind are handled transparently — your application always works
with plain UUID strings regardless of driver.

### Primary keys

`key.primary` now only accepts unsigned integer types or `p.uuid` variants.
`p.string` is no longer a valid primary key type:

```ts
// before
export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.string), // no longer valid
    title: p.string,
  },
});

// after
export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.uuid),
    title: p.string,
  },
});
```

This is a breaking change. Update all stores using `key.primary(p.string)`
to `key.primary(p.uuid)`. The same applies to `key.foreign(p.string)` — use
`key.foreign(p.uuid)` instead.

### Migrating

The compiler will flag any remaining uses of `p.string` as a primary or
foreign key type. Replace them with `p.uuid` and rebuild.

## Validation and request API cleanup

This release also simplifies a few validation and request-handling seams.

None of these changes are large features on their own, but together they make
the API more explicit and easier to reason about.

### Pema: `coerce` is now a method

In Pema, `coerce` used to be a getter that produced a modified schema, which
meant writing things like:

```ts
const id = p.u32.coerce.parse(request.query.get("id"));
```

In 0.37, `coerce` is now a real method:

```ts
const id = p.u32.coerce(request.query.get("id"));
```

This also applies to objects and nested schemas. Instead of sprinkling
`.coerce` through child fields, you now usually coerce at the point where you
actually parse:

```ts
// before
const FormSchema = p({ counter: p.number.coerce });
const body = FormSchema.parse(request.body.form());

// after
const body = p({ counter: p.number }).coerce(request.body.form());
```

This reads better, and it makes coercion a parsing strategy rather than a
special schema flavour.

### Request bags gained `.coerce(schema)`

`request.query`, `request.path`, `request.headers`, and `request.cookies` are
all `RequestBag`s: normalized bags of string values.

They already supported `.parse(schema)`. They now also support
`.coerce(schema)` for schemas that expose coercive parsing.

```ts
const query = request.query.coerce(p({
  page: p.u32,
  active: p.boolean,
}));
```

This is a convenience API only — you can still always write the equivalent
schema call directly:

```ts
const query = p({
  page: p.u32,
  active: p.boolean,
}).coerce(request.query.toJSON());
```

### `request.body` is now transport-only

`request.body` methods no longer accept a schema. They now simply decode the
body into its transport-level representation:

```ts
request.body.json()
request.body.form()
request.body.text()
request.body.files()
request.body.binary()
```

Validation now happens explicitly on the schema side:

```ts
// before
const body = request.body.json(p.number.coerce);

// after
const body = p.number.coerce(request.body.json());
```

and:

```ts
// before
const body = request.body.form(LoginSchema);

// after
const body = LoginSchema.parse(request.body.form());
```

This keeps `RequestBody` focused on decoding HTTP payloads, leaves validation
policy in the hands of the schema, and translates better to the non-JavaScript
backends.

### Migrating

Most migrations are mechanical:

```ts
// before
p.u32.coerce.parse(x)

// after
p.u32.coerce(x)
```

```ts
// before
request.body.form(MySchema)

// after
MySchema.parse(request.body.form())
```

```ts
// before
request.body.json(p.number.coerce)

// after
p.number.coerce(request.body.json())
```

## What's next

Check out our issue tracker for [upcoming features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[modules]: /docs/modules
[stores]: /docs/stores
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[upcoming features]: https://github.com/primate-run/primate/milestone/10

