---
title: Data stores
---

# Stores

A **store** is a collection of methods for accessing data. Stores can be backed
by APIs, filesystems, caches, or other sources.

The most common store is the **`DatabaseStore`**, a collection of records with
a schema and a common interface, backed by a relational or document database.
This page focuses on database stores, the most widely used.

## Mapping

| Driver         | Maps to    | Examples                          |
| -------------- | ---------- | --------------------------------- |
| SQL            | table      | SQLite, MySQL, PostgreSQL, Oracle |
| Document/NoSQL | collection | JSONDB, MongoDB                   |

Stores have:

* **Schema** — field names and types (Pema)
* **API** — type-safe CRUD and queries
* **Driver** — the database connection to use

## Define a store

Create a file under `stores` and export a store. Every store requires three
fields: `table`, `db`, and `schema`.

Stores may also define `migrate`, which defaults to `true`. Set
`migrate: false` for stores that should not participate in migration
generation.

```ts
// stores/Post.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "post",
  db,
  schema: {
    id: store.key.primary(p.u32),
    title: p.string.max(100),
    body: p.string,
    created: p.date.default(() => new Date()),
  },
});
```

Passing an incorrect `table`, `db`, or `schema` throws immediately at
construction time.

Database stores require a primary key field. Pema types (`string`, `number`,
`boolean`, `date`, etc.) enforce validation and map to database columns.

### Portability

Because `table` and `db` are declared explicitly in the store file, stores are
fully self-contained modules. You can import and use them anywhere — migration
scripts, test suites, REPLs, or any other context outside a running Primate
app — without any framework initialisation.

```ts
// scripts/migrate.ts
import Post from "../stores/Post.ts";

await Post.drop();
```

### Primary keys

Define primary keys with `key.primary()`:
```ts
import store from "primate/store";
import p from "pema";

// auto-generated integer PK (default)
id: store.key.primary(p.u32)

// auto-generated UUID PK
id: store.key.primary(p.uuid)

// bigint PK
id: store.key.primary(p.u64)

// manual PK (no auto-generation)
id: store.key.primary(p.u32, { generate: false })
```

Supported PK types:
- **Unsigned integers**: `u8`, `u16`, `u32`, `u64`, `u128`
- **UUIDs**: `p.uuid`, `p.uuid.v4()`, `p.uuid.v7()`

### Foreign keys

Define foreign keys with `key.foreign()` to reference other stores:
```ts
import store from "primate/store";
import p from "pema";

export default store({
  table: "article",
  db,
  schema: {
    id: store.key.primary(p.u32),
    title: p.string,
    author_id: store.key.foreign(p.u32),  // references User.id
  },
});
```

Foreign keys should use the same scalar type as the referenced primary key,
for example `key.foreign(p.u32)` or `key.foreign(p.uuid)`.

## Relations

Define relationships between stores inline in the schema using `store.relation`.

### One-to-many

A user has many articles:
```ts
// stores/User.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    articles: store.relation.many({ table: "article", by: "author_id" }),
  },
});
```

### One-to-one

A user has one profile:
```ts
// stores/User.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    profile: store.relation.one({ table: "profile", by: "user_id" }),
  },
});
```

### Reverse relations

Query from the *many* side back to the *one* side using `reverse: true`:
```ts
// stores/Article.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "article",
  db,
  schema: {
    id: store.key.primary(p.u32),
    title: p.string,
    author_id: store.key.foreign(p.u32),
    author: store.relation.one({ table: "user", by: "author_id", reverse: true }),
  },
});
```

### Loading relations

Use the `with` option to load related records. Pass the store directly:
```ts
import Article from "#store/Article";

const users = await User.find({
  with: { articles: Article },
});
```

Pass a query object with `store` plus any sub-query options:
```ts
import Article from "#store/Article";

const users = await User.find({
  where: { active: true },
  with: {
    articles: {
      store: Article,
      select: ["title", "created"],
      sort: { created: "desc" },
      limit: 5,
    },
  },
});

// result:
// [
//   {
//     id: "...",
//     name: "John",
//     articles: [
//       { title: "First Post", created: ... },
//       { title: "Second Post", created: ... },
//     ]
//   }
// ]
```

Each relation sub-query can specify:
- `store` — the related store (required)
- `select` — fields to include
- `sort` — ordering
- `where` — filter criteria
- `limit` — max records per parent

Primate validates that the store passed in `with` matches the table declared in
the relation. Passing the wrong store throws a `relation_table_mismatch` error.

## Operators

The `where` option supports operators for non-equality comparisons.

### Comparison operators

Available on numbers, bigints, and dates:

```ts
const posts = await Post.find({
  where: { views: { $gt: 100 } },
});
```

| Operator  | Meaning               | Types                    |
| --------- | --------------------- | ------------------------ |
| `$gt`     | greater than          | number, bigint           |
| `$gte`    | greater than or equal | number, bigint           |
| `$lt`     | less than             | number, bigint           |
| `$lte`    | less than or equal    | number, bigint           |
| `$ne`     | not equal             | number, bigint           |
| `$after`  | after                 | date                     |
| `$before` | before                | date                     |

### String operators

```ts
const users = await User.find({
  where: { name: { $like: "Ali%" } },
});
```

| Operator  | Meaning                      |
| --------- | ---------------------------- |
| `$like`   | case-sensitive pattern match |
| `$ilike`  | case-insensitive pattern match |
| `$ne`     | not equal                    |

Use `%` as a wildcard and `_` as a single-character wildcard.

### $in operator

Match records whose field value is in a given list. Works on strings, numbers,
bigints, dates, and UUIDs:

```ts
const users = await User.find({
  where: { name: { $in: ["John", "Bob", "Larry"] } },
});

const posts = await Post.find({
  where: { status: { $in: ["draft", "published"] } },
});
```

Passing an empty array throws — an empty `$in` can never match anything and
is almost always a programmer mistake.

## Pagination

### Limit

Cap the number of results with `limit`:

```ts
const posts = await Post.find({
  sort: { created: "desc" },
  limit: 20,
});
```

### Offset

Skip a number of records with `offset`. Requires `limit` to be set:

```ts
const page = await Post.find({
  sort: { created: "desc" },
  limit: 20,
  offset: 40,
});
```

Using `offset` without `limit` throws. All six database drivers support offset
pagination natively.

## Configure a database

Install a Primate database driver and create a `config/db` directory with your
database file.

[s=stores/db/install]

[s=stores/db/config]

Name the file freely. For the main driver, use `index.ts` or `default.ts`.
Import it into your stores as `db` from `#db`.

## Migrations

Primate can manage schema changes for database stores through an opt-in
migration system.

Enable it in `config/app.ts` by telling Primate which database should track
applied migrations and which table to use:

```ts
import config from "primate/config";
import db from "#db";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
    },
  },
});
```

If `db.migrations` is not configured, migrations are disabled.

Once enabled, the workflow is:

```bash
npx primate migrate:create --name="add posts"
npx primate migrate:status
npx primate migrate:apply
```

`migrate:create` compares your current stores to the live database and writes a
new numbered migration file into `migrations/`. `migrate:status` shows which
migrations are applied and which are pending. `migrate:apply` runs pending
migrations in order and records them in the migration table.

Primate is strict about unapplied migrations. If migration files exist that
have not yet been applied, `migrate:create` refuses to generate another one on
top. And when serving a built app, Primate checks the migration version
captured at build time and errors on startup if the database is behind.

## Lifecycle

Create tables or collections at app startup, e.g. in a route file.
```ts
import Post from "#store/Post";

await Post.create();

// ... later (e.g., tests/teardown)
// await Post.drop();
```

You can safely call `create()` multiple times; drivers treat it as idempotent.
Good for prototyping. In production, prefer migrations to manage schema changes
ahead of time.

## Usage in routes

A typical route that reads (or creates) a record, then renders a view:
```ts
// routes/posts/index.ts
import Post from "#store/Post";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get() {
      const posts = await Post.find({
        where: {},
        sort: { created: "desc" },
        select: ["id", "title", "created"],
        limit: 20,
      });

      return response.view("posts.jsx", { posts });
  },
  async post(request) {
      const body = p({
        title: p.string.max(100),
        body: p.string,
      }).coerce(await request.body.form());

      const created = await Post.insert(body);

      return response.view("posts/created.jsx", { post: created });
  },
});
```

## Extending stores

Add custom methods to stores with `.extend()`. Extensions can be defined
inline or in separate files for modularity.
```ts
// stores/User.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.u32),
    name: p.string,
    age: p.u8.range(0, 120),
    lastname: p.string.optional(),
  },
}).extend(User => ({
  findByAge(age: typeof User.Schema.age) {
    return User.find({ where: { age } });
  },
  async getAverageAge() {
    const users = await User.find({ where: {} });
    return users.reduce((sum, u) => sum + u.age, 0) / users.length;
  },
}));
```

Extended stores are excluded from migration generation automatically; migrations
operate on the base store definitions.

### Modular extensions

Create a base store:
```ts
// stores/User.ts
import p from "pema";
import store from "primate/store";
import db from "#db";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.u32),
    name: p.string,
    age: p.u8.range(0, 120),
    lastname: p.string.optional(),
  },
});
```

Create an extended version:
```ts
import Base from "#store/User";

export default Base.extend(User => {
  const Schema = User.Schema;

  return {
    findByAge(age: typeof Schema.age) {
      return User.find({ where: { age } });
    },
    findByNamePrefix(prefix: typeof Schema.name) {
      return User.find({ where: { name: { $like: `${prefix}%` } } });
    },
    async updateAge(id: typeof Schema.id, age: typeof Schema.age) {
      return User.update(id, { set: { age } });
    },
    async getAverageAge() {
      const users = await User.find({ where: {} });
      return users.reduce((sum, u) => sum + u.age, 0) / users.length;
    },
  };
});
```

## Bespoke SQL

Store schemas can be passed directly to `db.sql` for typed raw SQL queries,
letting you reuse your existing type definitions without duplication:

```ts
import db from "#db";
import User from "#store/User";

const findByAge = db.sql({
  input: User.schema,
  query: "SELECT name FROM users WHERE age > :age",
  output: p.array(p({ name: p.string })),
});

const results = await findByAge({ age: 18 });
```

TypeScript enforces that every required field in the store schema has a
matching placeholder in the query. Optional fields are exempt.

See the [databases](/docs/database#typed-bespoke-sql) page for the full
`db.sql` API.
