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

| Driver         | Maps to    | Examples                  |
| -------------- | ---------- | ------------------------- |
| SQL            | table      | SQLite, MySQL, PostgreSQL |
| Document/NoSQL | collection | MongoDB                   |

Stores have:

* **Schema** — field names and types (Pema)
* **API** — type-safe CRUD and queries
* **Driver** — the database connection to use

## Define a store

Create a file under `stores` and export a store. Every store requires three
fields: `name`, `db`, and `schema`.

```ts
// stores/Post.ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import db from "#db";

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

Passing an incorrect `name`, `db`, or `schema` throws immediately at
construction time.

Database stores require a primary key field. Pema types (`string`, `number`,
`boolean`, `date`, etc.) enforce validation and map to database columns.

### Portability

Because `db` and `name` are declared explicitly in the store file, stores are
fully self-contained modules. You can import and use them anywhere — migration
scripts, test suites, REPLs, or any other context outside a running Primate
app — without any framework initialisation.

```ts
// scripts/migrate.ts
import Post from "../stores/Post.ts";

await Post.schema.create();
```

### Primary keys

Define primary keys with `key.primary()`:
```ts
import key from "primate/orm/key";
import p from "pema";

// auto-generated integer PK (default)
id: key.primary(p.u32)

// auto-generated string PK (UUID)
id: key.primary(p.string)

// bigint PK
id: key.primary(p.u64)

// manual PK (no auto-generation)
id: key.primary(p.u32, { generate: false })
```

Supported PK types:
- **Integers**: `u8`, `u16`, `u32`, `i8`, `i16`, `i32` — auto-increment
- **Bigints**: `u64`, `u128`, `i64`, `i128` — manual generation via MAX+1
- **Strings**: `string` — UUID generation

!!!
MongoDB only supports `string` primary keys for auto-generation due to its
native ObjectId system.
!!!

### Foreign keys

Define foreign keys with `key.foreign()` to reference other stores:
```ts
import key from "primate/orm/key";
import p from "pema";

export default store({
  name: "article",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string,
    author_id: key.foreign(p.u32),  // references User.id
  },
});
```

## Relations

Define relationships between stores using the `relation` module.

### One-to-many

A user has many articles:
```ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import relation from "primate/orm/relation";
import p from "pema";
import db from "#db";
import Article from "#store/Article";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.string),
    name: p.string,
  },
  relations: {
    articles: relation.many(Article, "author_id"),
  },
});
```

### One-to-one

A user has one profile:
```ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import relation from "primate/orm/relation";
import p from "pema";
import db from "#db";
import Profile from "#store/Profile";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.string),
    name: p.string,
  },
  relations: {
    profile: relation.one(Profile, "user_id"),
  },
});
```

### Reverse relations

Query from the *many* side back to the *one* side:
```ts
// stores/Article.ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import relation from "primate/orm/relation";
import p from "pema";
import db from "#db";
import User from "#store/User";

export default store({
  name: "article",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string,
    author_id: key.foreign(p.u32),
  },
  relations: {
    author: relation.one(User, "author_id", { reverse: true }),
  },
});
```

### Loading relations

Use the `with` option to load related records:
```ts
const users = await User.find({
  where: { active: true },
  with: {
    articles: {
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

Each relation can specify:
- `select` — fields to include
- `sort` — ordering
- `where` — filter criteria
- `limit` — max records per parent

Use `true` to load a relation with defaults:
```ts
const users = await User.find({
  where: { active: true },
  with: { articles: true, profile: true },
});
```

## Configure a database

Install a Primate database driver and create a `config/db` directory with your
database file.

[s=stores/db/install]

[s=stores/db/config]

Name the file freely. For the main driver, use `index.ts` or `default.ts`.
Import it into your stores as `db` from `#db`.

## Lifecycle

Create tables or collections at app startup, e.g. in a route file.
```ts
import Post from "#store/Post";

await Post.schema.create();

// ... later (e.g., tests/teardown)
// await Post.schema.delete();
```

You can safely call `create()` multiple times; drivers treat it as idempotent.
Good for prototyping. In production, create them ahead of time.

## Usage in routes

A typical route that reads (or creates) a record, then renders a view:
```ts
// routes/posts/index.ts
import Post from "#store/Post";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

route.get(async () => {
  const posts = await Post.find({
    where: {},
    sort: { created: "desc" },
    select: ["id", "title", "created"],
    limit: 20,
  });

  return response.view("posts.jsx", { posts });
});

route.post(async request => {
  const body = request.body.form(p({
    title: p.string.max(100),
    body: p.string,
  }).coerce);

  const created = await Post.insert(body);

  return response.view("posts/created.jsx", { post: created });
});
```

## Extending stores

Add custom methods to stores with `.extend()`. Extensions can be defined
inline or in separate files for modularity.
```ts
// stores/User.ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import db from "#db";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.u32),
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

### Modular extensions

Create a base store:
```ts
// stores/User.ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import db from "#db";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.u32),
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
      return User.update({ where: { id }, set: { age } });
    },
    async getAverageAge() {
      const users = await User.find({ where: {} });
      return users.reduce((sum, u) => sum + u.age, 0) / users.length;
    },
  };
});
```
