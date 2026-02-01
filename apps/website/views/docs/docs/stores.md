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

```ts title="#store/Post.ts"
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

Database stores require an `id: primary` field. Pema types (`string`, `number`,
`boolean`, `date`, etc.) enforce validation and map to database columns.

!!!
Store filenames map to table or collection names:
* `stores/User.ts` -> `user`
* `stores/login/User.ts` -> `login_user`

Override with a [custom name](#custom-name).
!!!

## Configure a database

If you don't configure a database, the default one is in‑memory, great for
prototyping and tests. To add a database, install a Primate driver.

[s=stores/db/install]

## Create a database file

Create `config/db` and place your database file there.

[s=stores/db/config]

!!!
Name the file freely. For the main driver, use `index.ts` or `default.ts`.
!!!

## Lifecycle

Create tables or collections at app startup, e.g. in a route file.

```ts
import Post from "#store/Post";

await Post.schema.create();
// ... later (e.g., tests/teardown)
// await Post.schema.delete();
```

You can safely call `create()` multiple times; drivers treat it as idempotent.

!!!
Good for prototyping. In production, create them ahead of time.
!!!

## Usage in routes

A typical route that reads (or creates) a record, then renders a view:

```ts title="routes/posts/index.ts"
import Post from "#store/Post";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

route.get(async () => {
  // fetch the most recent posts
  const posts = await Post.find({}, {
    sort: { created: "desc" },
    select: { id: true, title: true, created: true },
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

!!!
In the `post` route handler, two types of validations take place: the shape of
the `body` is validated against an ad-hoc Pema schema — it must contain a title
(≤100 chars) and a body. Later, before insertion, the entire record to be
inserted is validated. This distinction is important: not all backend
validation needs to repeat at the store layer.
!!!

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
    return User.find({ age });
  },

  async getAverageAge() {
    const users = await User.find({});
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
      return User.find({ age });
    },

    findByNamePrefix(prefix: typeof Schema.name) {
      return User.find({ name: { $like: `${prefix}%` } });
    },

    async updateAge(id: typeof Schema.id, age: typeof Schema.age) {
      return User.update(id, { age });
    },

    async getAverageAge() {
      const users = await User.find({});
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

### Extension types

Access field types with `typeof <param>.Schema.<fieldName>`.

```ts
User => {
  const Schema = User.Schema;

  return {
    // id: string (primary key)
    findById(id: typeof Schema.id) {
      return User.get(id);
    },
    // name: string
    updateName(id: typeof Schema.id, name: typeof Schema.name) {
      return User.update(id, { name });
    },
  };
}
```

!!!
Naming the parameter: The identifier inside `.extend(param => { ... })` is up
to you. We use `User` for clarity, but `This` (or any name) works the same.
Access types via `typeof <param>.R.<field>`.
!!!

!!!
Extensions have access to all base store methods (`find`, `insert`, `update`,
etc.) and can combine them to create higher-level operations.
!!!

## API

| method                      | returns          | description                    |
| --------------------------- | ---------------- | ------------------------------ |
| [insert(record)]            | `T`              | insert a record                |
| [get(id)]                   | `T`              | fetch a record or throw        |
| [try(id)]                   | `T \| undefined` | return a record or `undefined` |
| [has(id)]                   | `boolean`        | check if a record exists       |
| [find(criteria, options?)]  | `T[]`            | find records by criteria       |
| [count(criteria)]           | `number`         | count records by criteria      |
| [update(id, changes)]       | `void`           | update a single record         |
| [update(criteria, changes)] | `number`         | update multiple records        |
| [delete(id)]                | `void`           | delete a single record         |
| [delete(criteria)]          | `number`         | delete multiple records        |

[insert(record)]: #insert-record
[get(id)]: #get-id
[try(id)]: #try-id
[has(id)]: #has-id
[find(criteria, options?)]: #find-criteria-options
[count(criteria)]: #count-criteria
[update(id, changes)]: #update-id-changes
[update(criteria, changes)]: #update-criteria-changes
[delete(id)]: #delete-id
[delete(criteria)]: #delete-criteria

### `insert(record)`

Insert a record and return it. `id` is optional on input and is generated if
not supplied — the output record is guaranteed to contain an id.

The `insert` operation validates the input before passing it to the driver and,
if it fails, throws a Pema `ParseError`.

```ts
const post = await Post.insert({ title: "Hello", body: "..." });
post.id; // string
```

!!!
In Primate, ids are **always** strings, regardless of database storage. Drivers
map ids and other fields to and from their native types.
!!!

### `get(id)`

Fetch the record associated with the given `id`. Throws if the record doesn't
exist in the database.

```ts
const post = await Post.get(id);
```

### `try(id)`

Like `get(id)`, but instead of throwing if no record is found, it returns
`undefined`.

```ts
const post = await Post.try(id);
if (post === undefined) {
  // not found
}
```

### `has(id)`

Check existence by id.

```ts
if (await Post.has(id)) { /* ... */ }
```

### `find(criteria, options?)`

Query by field criteria with optional projection, sort, and limit.

```ts
// all posts by title
await Post.find({ title: "Hello" });

// projection: only return certain fields
await Post.find({}, { select: { id: true, title: true } });

// sorting and limiting
await Post.find({}, {
  sort: { created: "desc", title: "asc" },
  limit: 10,
});
```

### `count(criteria)`

Count matching records.

```ts
await Post.count({ title: "Hello" });
```

### `update(id, changes)`

Update a single record by id. Throws if the record is not found.

```ts
await Post.update(id, { title: "Updated" });
```

### `update(criteria, changes)`

Update all records matching criteria. Returns the number of records updated
(may be 0).

```ts
// multiple records -> returns count
const n = await Post.update({ title: "Draft" }, { title: "Published" });
```

**Unsetting fields**

If a field is **optional** in your schema, passing `null` in `changes`
**unsets** it (removes it).

```ts
// given: body?: string (optional)
await Post.update(id, { body: null });
const fresh = await Post.get(id);
// fresh.body is now undefined
```

### `delete(id)`

Delete a single record by id. Throws if the record is not found.

```ts
// throws if not found
await Post.delete(id);
```

### `delete(criteria)`

Delete all records matching criteria. Returns the number of records deleted
(may be 0).

```ts
// returns count of deleted records
await Post.delete({ title: "..." });
```

## Criteria

Criteria are equality checks:

```ts
await Post.find({ title: "Hello" });
```

!!!
**Operators:** String fields also support `$like` (e.g.,
`{ name: { $like: "Jo%" } }`). Drivers translate this appropriately
(SQL -> `LIKE`, MongoDB -> `$regex`).
!!!

## Types for stores

Any Pema type can be a field. Common ones:

* `primary` — primary key
* `string`, `number`, `boolean`, `date`
* `optional(T)` — nullable; can be unset with `null`

Example:

```ts
import p from "p";

export default store({
  id: p.primary,
  subtitle: string.max(120).optional(),
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
// config/db/postgresql.ts
import postgresql from "#db/postgresql";
import p from "p";

export default store(
  {
    id: key.primary(p.u32),
    message: p.string,
    created: p.date.default(() => new Date()),
  },
  {
    // pin to a specific database
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
import p from "p";

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
