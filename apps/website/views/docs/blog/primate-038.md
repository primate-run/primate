---
title: Primate 0.38: The route is the contract
epoch: 1777628817000
author: terrablue
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
typed route clients, and `client.form` integration. Each one builds on the last.

## Declarative route exports

Routes now export their handlers as a default export using the new `route()`
function, rather than registering them as side effects:

```ts
import route from "primate/route";

export default route({
  get: () => "hello",
  post: async (request) => {
    const body = await request.body.json();
    // ...
  },
});
```

Route files are now pure — they describe what a route does without reaching
into a global registry to say so. Easier to reason about, easier to test,
easier to compose.

!!!
A route file at `routes/hello.ts` is automatically mounted at `/hello` —
no registration required. To mount to `/`, create `routes/index.ts`.
!!!

### Content type declaration

Declare what content type your handler expects with `route.with`:

```ts
import route from "primate/route";

export default route({
  post: route.with({ contentType: "application/json" }, async (request) => {
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
const json = await request.body.json();
const text = await request.body.text();
const form = await request.body.form();
const { form, files } = await request.body.multipart();
const blob = await request.body.blob();
```

All accessors are async and on-demand — the body is never preparsed. It can
only be consumed once; calling a body accessor a second time throws.

### Body schema

Pair the content type with a Pema schema to get runtime validation and
narrowed types in the handler:

```ts
import route from "primate/route";
import p from "pema";

export default route({
  post: route.with(
    {
      contentType: "application/json",
      body: p({ foo: p.string }),
    },
    async (request) => {
      const { foo } = await request.body.json();
      // foo is typed as string — validated before this line runs
      return { foo };
    },
  ),
});
```

If the body fails validation, Primate returns `400 Bad Request` with
structured Pema error details before the handler runs. The handler only
executes if the body is valid and fully typed.

### Typed route client

Import a route directly into a view and you get a fully typed HTTP client.
No code generation. No schema files. No separate client definitions. The
route file is the source, and TypeScript sees it:

```ts
import route from "@/routes/user/register";

const response = await route.post({ body: { foo: "bar" } });
const data = await response.json();
```

TypeScript enforces the body type at the call site based on what the route
declares. If the route has `body: p({ foo: p.string })`, passing
`{ foo: 123 }` is a compile-time error. If the server rejects the body at
runtime, the `400` response with Pema's error structure comes straight back.

The same import works in SSR — on the server, the handler is invoked directly
with no network round-trip. The view code is identical in both contexts.

### `client.form`

Pass a route method to `client.form` and you get a fully wired, fully typed
form. The endpoint, the content type, the field types, and the validation
errors all come from the route declaration:

```tsx
import { client } from "@primate/react";
import route from "@/routes/user/register";

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
duplicated schema. Declare the route once and everything else follows.

`client.form` is available in all five supported frontends: React, Svelte,
Vue, Solid, and Angular.

### Hooks and helpers

Hook files follow the same declarative pattern, exporting a default function
using `hook()`:

```ts
import hook from "primate/route/hook";

export default hook((request, next) => {
  // runs before every route in this directory
  return next(request);
});
```

### Wasm routes

Go, Ruby, and Python routes keep their existing side-effect authoring model
— the ergonomics are appropriate for those runtimes. The underlying
implementation now returns a handlers object rather than registering into
the global route table directly, but this is invisible to route authors.

Wasm routes that access the request body must declare a `contentType`:

[s=blog/0.38/wasm]

If no `contentType` is declared and the body is accessed, Primate returns
an error.

## What's next for the route contract

The route-as-contract story isn't finished — 0.38 lays the foundation.
Here is what 0.39 will build on top of it.

### Schema-content type compatibility

Today, declaring `contentType: "application/x-www-form-urlencoded"` and
pairing it with a schema that expects numbers is silently wrong — forms
submit everything as strings. In 0.39, Pema schemas will advertise what
input shapes they can accept, and Primate will validate the pairing at
startup rather than at runtime.

This means:

```ts
// will error at startup — p.number cannot be satisfied by a form string
route.with(
  {
    contentType: "application/x-www-form-urlencoded",
    body: p({ foo: p.string, count: p.number }),
  },
  handler,
);

// correct — p.loose.number coerces the string "42" to 42
route.with(
  {
    contentType: "application/x-www-form-urlencoded",
    body: p({ foo: p.string, count: p.loose.number }),
  },
  handler,
);
```

The rule follows naturally from what `p.loose` already means: if a field
needs coercion to be satisfiable from a string source, say so explicitly.
The route declaration stays honest about what it actually accepts.

### Client-side validation

In 0.39, Pema schemas will travel over the wire and be revivified on the
client. `client.form` will run validation locally before the request is ever
sent — giving users immediate feedback without a round-trip.

Server-side validation always runs regardless. The client is an optimisation,
not a replacement.

Together these two changes close the loop: the schema declared in the route
governs what the form accepts, how it validates on the client, and what the
server enforces — all from the same declaration, with no duplication.

## Oracle database driver

Primate 0.38 adds `@primate/oracledb`, a native driver for Oracle Database.
The driver targets Oracle 23c (23ai Free and above) and uses the `oracledb`
Node.js package in thin mode — no Oracle Instant Client installation required.

```ts
import oracle from "@primate/oracledb";

export default oracle({
  host: "localhost",
  port: 1521,
  database: "FREEPDB1",
  username: "primate",
  password: "primate",
});
```

All standard Primate store operations are supported — `insert`, `find`, `get`,
`try`, `update`, `delete`, `count`, `has` — as well as relations, field
projection, sorting, limiting, and the full operator set (`$like`, `$gt`,
`$gte`, `$lt`, `$lte`, `$ne`, `$before`, `$after`, `$in`).

## JSON database driver

Primate 0.38 adds `@primate/jsondb`, a file-backed document database that
stores each table as a JSON file on disk. It requires no external DBMS and
is suited to local development and small deployments.

```ts
import jsondb from "@primate/jsondb";
import config from "primate/config";

export default jsondb({
  directory: "data",
});
```

All standard Primate store operations are supported — `insert`, `find`, `get`,
`try`, `update`, `delete`, `count`, `has` — as well as relations, field
projection, sorting, and limiting. All Primate field types are supported,
including `bigint`, `blob`, `datetime`, and `url`, which are serialized using
type-tagged JSON objects and revived transparently on load.

!!!
`jsondb` is not suited to high-concurrency workloads. For production use,
prefer a dedicated DBMS such as PostgreSQL or MySQL.
!!!

Thanks to [lioloc] for contributing this driver.

## Relations redesigned

Relations are now declared inline in the store schema rather than in a
separate `relations` field. Stores are fully self-contained — the schema is
the single source of truth for both data fields and relationships.

```ts
// before
import store from "primate/store";
import Article from "@/stores/Article";

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
import Article from "@/stores/Article";

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

## `$in` operator

All scalar field types now support the `$in` operator, which matches records
whose field value is in a given list:

```ts
const users = await User.find({
  where: { name: { $in: ["John", "Bob", "Larry"] } },
});

const posts = await Post.find({
  where: { status: { $in: ["draft", "published"] } },
});
```

`$in` works on strings, numbers, bigints, dates, and UUIDs. Passing an empty
array throws — an empty `$in` can never match anything and is almost always
a programmer mistake.

## Offset pagination

`find` now accepts an `offset` option for cursor-style pagination:

```ts
const page = await Post.find({
  sort: { created: "desc" },
  limit: 20,
  offset: 40,
});
```

`offset` requires `limit` — using offset without a limit throws. All six
database drivers support offset pagination natively.

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

## `HEAD` falls back to `GET`

Primate now handles `HEAD` requests correctly. If a route defines a `GET`
handler but no explicit `HEAD` handler, Primate automatically falls back to
the `GET` handler and strips the response body — returning only the headers,
as the HTTP specification requires.

```ts
export default route({
  get: () => response.json({ foo: "bar" }),
});
```

Define an explicit `head` handler if you need a bespoke response, and it takes
priority:

```ts
export default route({
  get: () => response.json({ foo: "bar" }),
  head: () => new Response(null, { headers: { "x-custom": "bespoke" } }),
});
```

Routes that only define non-GET verbs correctly return 404 on HEAD.

## Typed bespoke SQL

Sometimes you need to step outside the structured query API and write raw SQL
— for complex joins, database-specific functions, or queries that don't map
cleanly to a store operation. In 0.38, all four SQL drivers (SQLite, MySQL,
PostgreSQL, and OracleDB) expose `db.sql` for exactly this purpose.

```ts
const findByAge = db.sql({
  input: p({ age: p.u8 }),
  query: "SELECT name FROM users WHERE age > :age",
  output: p.array(p({ name: p.string })),
});

const results = await findByAge({ age: 18 });
```

`db.sql` returns a function. Call it with your input to execute the query.
Named placeholders (`:age`) map to input schema keys — TypeScript enforces
that every placeholder has a matching input key and vice versa, at compile
time. Input is validated against the input schema before the query runs.
Output is validated against the output schema after.

Both `input` and `output` are optional. A write-only query needs no output:

```ts
const insert = db.sql({
  input: p({ name: p.string, age: p.u8 }),
  query: "INSERT INTO users (name, age) VALUES (:name, :age)",
});

await insert({ name: "John", age: 30 });
```

A query with no parameters needs no input:

```ts
const findAll = db.sql({
  query: "SELECT name FROM users",
  output: p.array(p({ name: p.string })),
});

const results = await findAll();
```

DDL statements work too:

```ts
const createIndex = db.sql({
  query: "CREATE INDEX idx_users_name ON users (name)",
});

await createIndex();
```

Placeholder translation is handled automatically per driver. You always write
`:name` and the driver does the rest.

### Store schema interoperability

`db.sql` accepts a store's schema directly as input, letting you reuse
existing type definitions without duplication:

```ts
import User from "@/stores/User";

const findByAge = db.sql({
  input: User.schema,
  query: "SELECT name FROM users WHERE age > :age",
  output: p.array(p({ name: p.string })),
});
```

TypeScript enforces that every required field in the store schema has a
matching placeholder in the query — at compile time, before any code runs.
Optional fields are exempt. If you pass `User.schema` but omit `:name` in the
query, the error tells you exactly which placeholders are missing.

Use stores for structured CRUD, reach for `db.sql` when you need raw SQL,
and carry your schema definitions across both without rewriting them.

## Log hooks

Modules can now intercept every log entry Primate emits through a new
`onLog` lifecycle hook.

```ts
import type { Module } from "primate";

export default (): Module => ({
  name: "my-logger",
  setup({ onLog }) {
    onLog(({ level, message }) => {
      fetch("https://logs.example.com/ingest", {
        method: "POST",
        body: JSON.stringify({ level, message, ts: Date.now() }),
      });
    });
  },
});
```

`onLog` fires on every log call regardless of the configured `log.level`
— so a production deployment running at `warn` can still ship `info` and
`trace` entries to a remote collector without changing what appears in the
terminal.

`LogEntry` carries two fields: `level` (`"error"`, `"warn"`, `"info"`, or
`"trace"`) and `message`.

## Loose and strict parsing

Pema 0.7 introduces `p.loose` and `p.strict` — namespaces that mirror the
full `p` API but control how input is interpreted.

`p.loose` activates coercion: string inputs are interpreted as their target
type where possible. This is useful for parsing form data, query strings, or
any source where values arrive as strings.

```ts
const schema = p.loose({
  age: p.u8,
  active: p.boolean,
});

schema.parse({ age: "30", active: "true" });
// { age: 30, active: true }
```

Looseness propagates through the schema — nested objects, arrays, and tuples
all coerce their leaf values. Use `p.strict` to opt specific fields back out:

```ts
const schema = p.loose({
  age: p.u8,
  code: p.strict.string, // must be a string, never coerced
});
```

The old `.coerce()` method is gone. `p.loose` and `p.strict` are the
replacement — more explicit, more composable, and applicable at any level of
a schema.

## Request bag parsing

`RequestBag` — the object that wraps query strings, headers, cookies, and
path parameters — now implements `symbol.parse`, the standard protocol for
objects that know how to present themselves to a parser.

This means you can pass a request bag directly to any Pema schema:

```ts
// before
const body = request.query.parse(p({ age: p.u8 }));

// after
const body = p.loose({ age: p.u8 }).parse(request.query);
```

The bag normalizes its keys and hands the resulting dict to the schema.
The separate `.parse()` and `.coerce()` methods on `RequestBag` are gone —
pass the bag directly to `p.loose` instead.

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
route.post(async (request) => {
  /* ... */
});

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

### Stores: unified import replaces separate `orm` paths

Replace the three separate `primate/orm/*` imports with a single
`primate/store` import and update `key` and `relation` usages to use
`store.key` and `store.relation`.

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
export default async (db) => {
  await db.client.unsafe(`
    ALTER TABLE your_table
      ALTER COLUMN your_column TYPE TIMESTAMPTZ
      USING your_column AT TIME ZONE 'UTC'
  `);
};
```

Repeat the `ALTER TABLE` block for each table that has a `date` column.

### CLI: `--build` renamed to `--outdir`

The `--build` flag on `primate build` and `primate serve` is renamed to
`--outdir`:

```sh
# before
primate build --build /tmp/my-build
primate serve --build /tmp/my-build

# after
primate build --outdir /tmp/my-build
primate serve --outdir /tmp/my-build
```

Update any build scripts or CI pipelines that pass a custom build directory.

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[lioloc]: https://github.com/liolocs
