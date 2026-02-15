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
* **Driver** — in-memory by default; override in config

## Define a store

Create a file under `stores` and export a store.

```ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store({
  id: key.primary(p.u32),
  title: p.string.max(100),
  body: p.string,
  created: p.date.default(() => new Date()),
});
```

Database stores require a primary key field. Pema types (`string`, `number`,
`boolean`, `date`, etc.) enforce validation and map to database columns.

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
import User from "#store/User";
import p from "pema";

export default store({
  id: key.primary(p.u32),
  title: p.string,
  author_id: key.foreign(User),  // references User.id
});
```

Store filenames map to table or collection names:

* `stores/User.ts` -> `user`
* `stores/login/User.ts` -> `login_user`

Override with a [custom name](#custom-name).

## Relations

Define relationships between stores using the `relation` module.

### One-to-many

A user has many articles:
```ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import relation from "primate/orm/relation";
import p from "pema";
import Article from "#store/Article";

export default store({
  id: key.primary(p.string),
  name: p.string,
}, {
  relations: {
    articles: relation.many(Article, "author_id"),
  },
});
```

### One-to-one

A user has one profile:
```ts
import Profile from "#store/Profile";

export default store({
  id: key.primary(p.string),
  name: p.string,
}, {
  relations: {
    profile: relation.one(Profile, "user_id"),
  },
));
```

### Reverse relations

Query from the *many* side back to the *one* side:
```ts
// Article store
import User from "#store/User";

export default store({
  id: key.primary(p.u32),
  title: p.string,
  author_id: key.foreign(User),
}, {
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

## Configure a database

If you don't configure a database, the default one is in memory, great for
prototyping and tests. To add a database, install a Primate driver.

[s=stores/db/install]

## Create a database file

Create `config/db` and place your database file there.

[s=stores/db/config]

Name the file freely. For the main driver, use `index.ts` or `default.ts`.

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
```ts title="routes/posts/index.ts"
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

export default store({
  id: key.primary(p.u32),
  name: p.string,
  age: p.u8.range(0, 120),
  lastname: p.string.optional(),
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

export default store({
  id: key.primary(p.u32),
  name: p.string,
  age: p.u8.range(0, 120),
  lastname: p.string.optional(),
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

Use in routes:
```ts
import User from "#store/UserExtended";
import route from "primate/route";

route.get(async () => {
  const bobs = await User.findByNamePrefix("Bob");
  const byAge = await User.findByAge(25);
  const average = await User.getAverageAge();

  return { bobs, byAge, average };
});
```

Extensions have access to all base store methods (`find`, `insert`, `update`,
etc.) and can combine them to create higher-level operations.

## API

| method                       | returns          | description                    |
| ---------------------------- | ---------------- | ------------------------------ |
| [insert(record)]             | `T`              | insert a record                |
| [get(pk)]                    | `T`              | fetch a record or throw        |
| [try(pk)]                    | `T \| undefined` | return a record or `undefined` |
| [has(pk)]                    | `boolean`        | check if a record exists       |
| [find(options)]              | `T[]`            | find records by criteria       |
| [count(criteria)]            | `number`         | count records by criteria      |
| [update(options)]            | `number`         | update records                 |
| [delete(options)]            | `number`         | delete records                 |

[insert(record)]: #insert-record
[get(pk)]: #get-pk
[try(pk)]: #try-pk
[has(pk)]: #has-pk
[find(options)]: #find-options
[count(criteria)]: #count-criteria
[update(options)]: #update-options
[delete(options)]: #delete-options

### `insert(record)`

Insert a record and return it. The primary key is optional on input and is
generated if not supplied —  the output record is guaranteed to contain a
primary key.

The `insert` operation validates the input before passing it to the driver and,
if it fails, throws a Pema `ParseError`.
```ts
const post = await Post.insert({ title: "Hello", body: "..." });
post.id; // number
```

### `get(pk)`

Fetch the record associated with the given primary key. Throws if the record
doesn't exist in the database.
```ts
const post = await Post.get(1);
```

Optionally pass `select` and `with` to project fields and load relations:
```ts
const post = await Post.get(1, {
  select: ["title"],
  with: { author: true },
});
```

### `try(pk)`

Like `get(pk)`, but instead of throwing if no record is found, it returns
`undefined`.

```ts
const post = await Post.try(1);
if (post === undefined) {
  // not found
}
```

Also supports `select` and `with` options:
```ts
const post = await Post.try(1, { select: ["title"], with: { author: true } });
```

### `has(pk)`

Check existence by primary key.
```ts
if (await Post.has(pk)) { /* ... */ }
```

### `find(options)`

Query records with criteria, projection, sort, limit, and relations.
```ts
// all posts by title
await Post.find({ where: { title: "Hello" } });

// projection: only return certain fields
await Post.find({ where: {}, select: ["id", "title"] });

// sorting and limiting
await Post.find({
  where: {},
  sort: { created: "desc", title: "asc" },
  limit: 10,
});

// with relations
await Post.find({
  where: {},
  with: {
    author: { select: ["name"] },
  },
});
```

### `count(criteria)`

Count matching records.
```ts
await Post.count({ where: { title: "Hello" } });
```

### `update(options)`

Update records matching criteria. Returns the number of records updated.
```ts
// update by criteria
const n = await Post.update({
  where: { status: "draft" },
  set: { status: "published" },
});
```

**Unsetting fields**

If a field is **optional** in your schema, passing `null` in `set`
**unsets** it (removes it).
```ts
// given: body?: string (optional)
await Post.update({ where: { id: 1 }, set: { body: null } });
const fresh = await Post.get(1);
// fresh.body is now undefined
```

### `delete(options)`

Delete records matching criteria. Returns the number of records deleted.
```ts
// delete by criteria
const n = await Post.delete({ where: { status: "archived" } });
```

## Query operators

### Comparison operators
```ts
// greater than / less than
await User.find({ where: { age: { $gt: 18 } } });
await User.find({ where: { age: { $gte: 18 } } });
await User.find({ where: { age: { $lt: 65 } } });
await User.find({ where: { age: { $lte: 65 } } });

// not equal
await User.find({ where: { status: { $ne: "inactive" } } });

// combine operators on same field
await User.find({ where: { age: { $gte: 18, $lte: 65, $ne: 30 } } });
```

### Date/time operators
```ts
// after / before for datetime fields
await Event.find({ where: { starts_at: { $after: new Date("2025-01-01") } } });
await Event.find({ where: { ends_at: { $before: new Date("2025-12-31") } } });
```

### Pattern matching
```ts
// case-sensitive LIKE (SQL wildcards: % for any chars, _ for single char)
await User.find({ where: { name: { $like: "John%" } } });

// case-insensitive LIKE
await User.find({ where: { email: { $ilike: "%@gmail.com" } } });

// escape literal % or _ with backslash
await Task.find({ where: { name: { $like: "100\\% complete" } } });
```

Pattern matching is implemented natively on each driver: `GLOB` for SQLite,
`LIKE`/`ILIKE` for PostgreSQL, `LIKE BINARY`/`LIKE` for MySQL, and `$regex`
for MongoDB.

## Types for stores

Any Pema type can be a field. Common ones:

* `key.primary(type)` — primary key
* `key.foreign(Store)` — foreign key reference
* `p.string`, `p.u32`, `p.boolean`, `p.date`
* `T.optional()` — nullable; can be unset with `null`

Example:
```ts
import p from "pema";
import key from "primate/orm/key";

export default store({
  id: key.primary(p.u32),
  subtitle: p.string.max(120).optional(),
  likes: p.i32.range(0, 1_000_000),
});
```

## Custom database

By default, stores use the app's default database. If you have multiple
databases in your app, you can **pin** a store to a specific one.
```ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import postgresql from "#db/postgresql";

export default store(
  {
    id: key.primary(p.u32),
    message: p.string,
    created: p.date.default(() => new Date()),
  },
  {
    database: postgresql,
  },
);
```

If you omit `database`, the default database is used.

## Custom name

Override the default table or collection name with `name`. Useful for exposing
part of a table as a store.
```ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import p from "pema";

export default store(
  {
    id: key.primary(p.u32),
    message: p.string,
    created: p.date.default(() => new Date()),
  },
  {
    name: "audit_log",
  },
);
```

If you omit `name`, the name will be generated from the filename.
