---
title: Primate 0.38: The route is the contract
epoch: 1775417680000
author: terrablue
published: false
---

Today we're announcing the availability of the Primate 0.38 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## The route is the contract

In most web frameworks, a route handler is just a function. The types it
expects live in a schema file. The validation logic lives somewhere else.
The client code that calls it is written separately. The form that submits
to it is configured independently. Everything drifts. Everything duplicates.
Everything goes out of sync.

Primate 0.38 takes a different position: **the route file is the single source
of truth**. What the server accepts, what TypeScript enforces at call sites,
what the runtime validates before your handler runs, and what your form wires
up automatically — all of it flows from one declaration.

This release introduces the full stack of that idea: declarative route exports,
typed route clients, and `client.form`. We'll walk through each layer in turn,
because they build on each other.

## Declarative route exports

The foundation is a new way to author routes. Previously, routes registered
handlers as side effects. In 0.38, route files export their handlers as a
default export using the new `route()` function:

```ts
import route from "primate/route";

export default route({
  get: () => "hello",
  post: async request => {
    const body = await request.body.json();
    // ...
  },
});
```

Route files are now pure — they describe what a route does without reaching
into a global registry to say so. This makes them easier to reason about,
easier to test, and easier to compose.

### Content type declaration

The first layer of the contract: declare what content type your handler
expects. Use `route.with` to pair a handler with its expected `Content-Type`:

```ts
import route from "primate/route";

export default route({
  post: route.with({ contentType: "application/json" }, async request => {
    const body = await request.body.json();
    // ...
  }),
});
```

If the incoming request doesn't match, Primate returns `415 Unsupported Media
Type` before your handler ever runs. No defensive checks inside the handler,
no silent misparses.

All five body types are supported:

```ts
const json            = await request.body.json();
const text            = await request.body.text();
const form            = await request.body.form();
const { form, files } = await request.body.multipart();
const blob            = await request.body.blob();
```

All accessors are async and on-demand — the body is never preparsed. It can
only be consumed once; calling a body accessor a second time throws.

### Body schema

The second layer: pair the content type with a pema schema to get runtime
validation and narrowed types in the handler:

```ts
import route from "primate/route";
import p from "pema";

export default route({
  post: route.with({
    contentType: "application/json",
    body: p({ foo: p.string }),
  }, async request => {
    const { foo } = await request.body.json();
    // foo is typed as string — validated before this line runs
    return { foo };
  }),
});
```

If the body fails validation, Primate returns `400 Bad Request` with
structured pema error details before the handler runs. The handler only
executes if the body is valid and fully typed.

### Typed route client

The third layer — and where the contract starts to pay off.

Import a route directly into a view and you get a fully typed HTTP client.
No code generation. No schema files. No separate client definitions. The
route file is the source, and TypeScript sees it:

```ts
import route from "#route/user/register";

const response = await route.post({ body: { foo: "bar" } });
const data = await response.json();
```

TypeScript enforces the body type at the call site based on what the route
declares. If the route has `body: p({ foo: p.string })`, passing
`{ foo: 123 }` is a compile-time error. If the server rejects the body at
runtime, the `400` response with pema's error structure comes straight back.

The same import works in SSR — on the server, the handler is invoked directly
with no network round-trip. The view code is identical in both contexts.

### client.form

The fourth layer — the full payoff.

Pass a route method to `client.form` and you get a fully wired, fully typed
form. The endpoint, the content type, the field types, and the validation
errors all come from the route declaration:

```tsx
import { client } from "@primate/react";
import route from "#route/user/register";

export default function Register() {
  const form = client.form(route.post);

  return (
    <form id={form.id} onSubmit={form.submit}>
      <input name="email" />
      <input name="age" type="number" />
      {form.field("email").error && <p>{form.field("email").error}</p>}
      {form.field("age").error && <p>{form.field("age").error}</p>}
      <button type="submit">Register</button>
    </form>
  );
}
```

`form.field("email")` is typed. `form.submit` posts to the right endpoint
with the right content type. When the server returns a `400`, validation
errors are automatically mapped to the right fields and surfaced via
`form.field("name").error`. `form.submitted` flips to `true` on success.

No endpoint URL strings. No separate form library configuration. No
duplicated schema. The route is the contract — declare it once, get
everything.

`client.form` is available in all five supported frontends: React, Svelte,
Vue, Solid, and Angular.

### Hooks and helpers

Hook files follow the same declarative pattern, exporting a default function
using `hook()`:

```ts
import hook from "primate/hook";

export default hook(async (request, next) => {
  // runs before every route in this directory
  return next(request);
});
```

Files prefixed with `-` are excluded from routing entirely and can be used
as shared helpers within a route directory:

```
routes/
  -utils.ts       ← not a route, importable as a helper
  index.ts        ← routed normally
  user.ts         ← routed normally
```

### Wasm routes

Go, Ruby, and Python routes keep their existing side-effect authoring model
— the ergonomics are appropriate for those runtimes. The underlying
implementation now returns a handlers object rather than registering into
the global route table directly, but this is invisible to route authors.

Wasm routes that access the request body must declare a `contentType`:

**Go**
```go
var _ = route.With(route.Options{ContentType: route.JSON}).
  Post(func(request route.Request) any {
    json, _ := request.Body.JSON()
    // ...
  })
```

**Ruby**
```ruby
Route.post(content_type: "application/json") do |request|
  json = request.body.json
  # ...
end
```

**Python**
```python
@Route.post(content_type="application/json")
def handler(request):
    json = request.body.json()
    # ...
```

If no `contentType` is declared and the body is accessed, Primate returns
an error.

## Oracle database driver

Primate 0.38 adds `@primate/oracledb`, a native driver for Oracle Database.
The driver targets Oracle 23c (23ai Free and above) and uses the `oracledb`
Node.js package in thin mode — no Oracle Instant Client installation required.

```ts
import oracle from "@primate/oracledb";
import config from "primate/config";

export default config({
  modules: [oracle({
    host: "localhost",
    port: 1521,
    database: "FREEPDB1",
    username: "primate",
    password: "primate",
  })],
});
```

All standard Primate store operations are supported — `insert`, `find`, `get`,
`try`, `update`, `delete`, `count`, `has` — as well as relations, field
projection, sorting, limiting, and the full operator set (`$like`, `$gt`,
`$gte`, `$lt`, `$lte`, `$ne`, `$before`, `$after`, `$in`).

## JSON Database driver

Primate 0.38 adds `@primate/jsondb`, a file-backed document database that
stores each table as a JSON file on disk. It requires no external DBMS and
is suited to local development and small deployments.

```ts
import jsondb from "@primate/jsondb";
import config from "primate/config";

export default config({
  modules: [jsondb({
    directory: "data",
  })],
});
```

All standard Primate store operations are supported — `insert`, `find`, `get`,
`try`, `update`, `delete`, `count`, `has` — as well as relations, field
projection, sorting, and limiting. All Primate field types are supported,
including `bigint`, `blob`, `datetime`, and `url`, which are serialized using
type-tagged JSON objects and revived transparently on load.

JSON Database is not suited to high-concurrency workloads. For production use,
prefer a dedicated DBMS such as PostgreSQL or MySQL.

Thanks to [lioloc] for contributing this driver.

## Relations redesigned

Relations are now declared inline in the store schema rather than in a
separate `relations` field. This makes stores fully self-contained — the
schema is the single source of truth for both data fields and relationships.

```ts
// before
import store from "primate/store";
import Article from "#store/Article";

export default store({
  table: "author",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
  },
  relations: {
    articles: store.relation.many(Article, "author_id"),
  },
});

// after
export default store({
  table: "author",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    articles: store.relation.many({ table: "article", by: "author_id" }),
  },
});
```

Relations are declared with a plain `{ table, by }` object instead of a
store reference — no circular import risk, no registry. The `table` string
names the related table; `by` names the foreign key column.

Loading relations now requires passing the related store explicitly in the
`with` option:

```ts
// before
const authors = await Author.find({
  with: { articles: true },
});

// after
import Article from "#store/Article";

const authors = await Author.find({
  with: { articles: Article },
});
```

Passing the store instead of `true` lets Primate validate that the store
matches the declared relation table, catching mismatches immediately
rather than silently returning wrong data.

Sub-queries work the same way, with `store` now required alongside the other
options:

```ts
const authors = await Author.find({
  with: {
    articles: {
      store: Article,
      where: { published: true },
      select: ["id", "title"],
      sort: { created: "desc" },
      limit: 5,
    },
  },
});
```

## $in operator

All scalar field types now support the `$in` operator, which matches records
whose field value is in a given list:

```ts
const users = await User.find({
  where: { name: { $in: ["Alice", "Bob", "Carol"] } },
});

const posts = await Post.find({
  where: { status: { $in: ["draft", "published"] } },
});
```

`$in` works on strings, numbers, bigints, dates, and UUIDs. Passing an empty
array throws an error — an empty `$in` can never match anything and is almost
always a programmer mistake.

## Offset pagination

`find` now accepts an `offset` option for cursor-style pagination:

```ts
const page = await Post.find({
  sort: { created: "desc" },
  limit: 20,
  offset: 40,
});
```

`offset` requires `limit` to be set — using offset without a limit throws.
All six database drivers support offset pagination natively.

## Vue style tag support

Primate 0.38 adds support for `<style>` blocks in Vue single-file components.
Previously, styles defined inside a `.vue` file were silently ignored at
runtime. They are now compiled and injected into the page automatically.

```vue
<template>
  <p class="hello">Hello, world!</p>
</template>

<style>
.hello {
  color: red;
}
</style>
```

Scoped styles (`<style scoped>`) are also supported.

## HEAD falls back to GET

Primate now handles `HEAD` requests correctly. If a route defines a `GET`
handler but no explicit `HEAD` handler, Primate automatically falls back to
the `GET` handler and strips the response body — returning only the headers,
as the HTTP specification requires.

```ts
export default route({
  get: () => response.json({ foo: "bar" }),
});
```

If you need a bespoke `HEAD` response, define an explicit handler and it takes
priority:

```ts
export default route({
  get: () => response.json({ foo: "bar" }),
  head: () => new Response(null, { headers: { "x-custom": "bespoke" } }),
});
```

Routes that only define non-GET verbs correctly return 404 on HEAD.

## Raw database client access

Every database driver now exposes its underlying client via `db.client`.
This gives you an escape hatch for operations that fall outside Primate's
structured API — custom DDL, driver-specific features, or anything else the
abstraction does not cover.

The type of `db.client` is specific to each driver:

| Driver     | Type           |
| ---------- | -------------- |
| PostgreSQL | `Sql`          |
| MySQL      | `Pool`         |
| SQLite     | `Client`       |
| MongoDB    | `MongoClient`  |
| Oracle     | `Connection`   |

The most common use case is a migration that requires raw SQL:

```ts
export default async db => {
  await db.client.unsafe(`
    ALTER TABLE your_table
      ALTER COLUMN your_column TYPE TIMESTAMPTZ
      USING your_column AT TIME ZONE 'UTC'
  `);
};
```

`db.client` is intentionally unabstracted — reaching for it means you are
writing driver-specific code, and the type system reflects that.

## Unified store API

Store-related imports are now consolidated under a single `primate/store` entry
point. The separate `primate/orm/store`, `primate/orm/key`, and
`primate/orm/relation` imports are gone.

```ts
// before
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store({
  table: "user",
  db,
  schema: {
    id: key.primary(p.u32),
    name: p.string,
  },
});

// after
import store from "primate/store";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.u32),
    name: p.string,
  },
});
```

This is a breaking change. Update all store files to use the new import.

## Breaking changes

### Routes: declarative exports replace side-effect registration

The old `route.get(handler)` / `route.post(handler)` pattern no longer works.
Migrate to `export default route({...})`:

```ts
// before
route.get(() => "hello");
route.post(async request => { /* ... */ });

// after
export default route({
  get() {
    return "hello";
  },
  async post(request) {
    /* ... */
  },
});
```

### Request body: accessors are now async

All `request.body` accessors are now async. Update any synchronous body access:

```ts
// before
const body = request.body.json();

// after
const body = await request.body.json();
```

`request.body.binary` is renamed to `request.body.blob()`.
`request.body.multipart()` is now separate from `request.body.form()` and
returns `{ form, files }`.

### Frontend client: named export replaces default import

The `client` object is now a named export from each frontend package.
Update any existing imports:

```ts
// before
import client from "@primate/react/client";

// after
import { client } from "@primate/react";
```

The same applies to all five frontends — replace `@primate/svelte/client`,
`@primate/vue/client`, `@primate/solid/client`, and `@primate/angular/client`
with the named `{ client }` import from the root package.

### Stores: `name` renamed to `table`, DDL methods promoted

The `name` field in store definitions is now `table`:

```ts
// before
export default store({
  name: "user",
  db,
  schema: { ... },
});

// after
export default store({
  table: "user",
  db,
  schema: { ... },
});
```

The `store.table.create()` and `store.table.delete()` DDL methods are now
top-level methods directly on the store:

```ts
// before
await User.table.create();
await User.table.delete();

// after
await User.create();
await User.drop();
```

Note the rename from `delete` to `drop` — this avoids ambiguity with the
data-level `store.delete()` method which removes records, not the table itself.

### Stores: unified import replaces separate orm paths

Replace the three separate imports with a single `primate/store` import and
update `key` and `relation` usages to use `store.key` and `store.relation`.

### Relations: inline schema replaces separate `relations` field

Move all relation definitions from the `relations` object into the `schema`,
and update the relation syntax to use `{ table, by }` instead of passing a
store or schema reference:

```ts
// before
export default store({
  table: "author",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
  },
  relations: {
    articles: store.relation.many(Article, "author_id"),
    profile: store.relation.one(Profile, "author_id"),
  },
});

// after
export default store({
  table: "author",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    articles: store.relation.many({ table: "article", by: "author_id" }),
    profile: store.relation.one({ table: "profile", by: "author_id" }),
  },
});
```

Update all `with: { relation: true }` usages to pass the related store
directly, and add `store:` to any sub-query objects.

### PostgreSQL: `date` now uses `TIMESTAMPTZ`

The `date` Pema type previously mapped to `TIMESTAMP` (without timezone)
in PostgreSQL. In 0.38 it maps to `TIMESTAMPTZ` (timestamp with timezone).

This is the correct default — `TIMESTAMP` is a naive datetime that produces
incorrect results when the database server and application are in different
timezones. `TIMESTAMPTZ` stores the absolute moment in time unambiguously.

If you have existing `date` columns in PostgreSQL, create a migration with
the next number in your `migrations/` directory:

```ts
export default async db => {
  await db.client.unsafe(`
    ALTER TABLE your_table
      ALTER COLUMN your_column TYPE TIMESTAMPTZ
      USING your_column AT TIME ZONE 'UTC'
  `);
};
```

Repeat the `ALTER TABLE` block for each table that has a `date` column.

## What's next

Check out our issue tracker for [upcoming features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[upcoming features]: https://github.com/primate-run/primate/milestone/11
[lioloc]: https://github.com/lioloc
