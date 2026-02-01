---
title: Using databases
---

# Databases

Databases back stores. You define them under `config/db`, import them via `#db`,
and use them in stores (or directly).

## Overview

| Database                                | Storage        | Type        |
| --------------------------------------- | -------------- | ----------- |
| InMemory                                | in-memory      | relational  |
| [SQLite](/docs/database/sqlite)         | in-memory/file | relational  |
| [MySQL](/docs/database/mysql)           | DBMS           | relational  |
| [PostgreSQL](/docs/database/postgresql) | DBMS           | relational  |
| [MongoDB](/docs/database/mongodb)       | DBMS           | document    |

## Default resolution

Primate resolves the **default database** from `config/db` as follows.

1. If the directory is **missing** or **empty**, Primate writes
   `config/db/index.ts` with:

   ```ts
   import db from "primate/db";
   export default db();
   ```

   This is an **in-memory, ephemeral** database (no persistence).
2. Else use `index.ts` or `index.js` if present.
3. Else use `default.ts` or `default.js` if present.
4. Else if there is exactly one file, use that file.
5. If multiple files exist and none is `index`/`default`, throw an error.

This default is what `#db` imports.

!!!
**TypeScript note** — the compiler cannot map `#db` to "the only file in
config/db". If you use rule 4, create `config/db/index.ts` that re-exports your
file. Runtime discovery still works without it, but TS needs the stub to resolve
`#db`.
!!!

## Import paths

* `#db` -> `config/db/index.(ts|js)` or `default.(ts|js)`, or the sole file,
per the resolution rules above
* `#db/<name>` -> `config/db/<name>.ts` or `.js`.

Examples:

```ts
// config/db/postgresql.ts
import postgresql from "@primate/postgresql";
export default postgresql({ /* connection options */ });
```

```ts
// anywhere
import db from "#db";             // default database
import pg from "#db/postgresql";  // named database
```

## Using databases in stores

Stores use the **default** database unless pinned. Pin a store by passing a
`database` in the second argument.

```ts
import postgresql from "#db/postgresql";
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store(
  { id: key.primary(p.u32), title: p.string },
  { db: postgresql },
);
```

See the [stores](/docs/stores) page for the full store API.

## Non-`DatabaseStore` usage

You can skip `DatabaseStore` and call a database directly. Import a database
and export your own module with the operations you need.

```ts
// stores/Custom.ts
import db from "#db";

// the db client is lazily initialized on first use and reused afterwards.
export default new class Custom {
  async getAll() {
    return db.read(
      { name: "widget", types: { /* schema types */ } }, // As
      { criteria: {} },                                  // args
    );
  }
}();
```

Use this when your access pattern doesn't fit the `DatabaseStore` shape, or
you want full control over queries.

## Driver shape (CRUD)

All database drivers implement the same abstract CRUD surface. You usually
won't call these directly unless writing a custom store or a new driver.

```ts
// create one record; returns the unbound (typed) record with id
create<O extends Dict>(
  as: As,
  args: { record: Dict },
): MaybePromise<O>;

// read count of matching records
read(as: As, args: { count: true; criteria: Dict }): MaybePromise<number>;

// read matching records, with optional projection/limit/sort
read(
  as: As,
  args: {
    criteria: Dict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }
): MaybePromise<Dict[]>;

// update matching records; returns number updated
update(
  as: As,
  args: { changes: Dict; criteria: Dict }
): MaybePromise<number>;

// delete matching records; returns number deleted
delete(as: As, args: { criteria: Dict }): MaybePromise<number>;
```

Helpers provided by the base `Database` class include:

* identifier quoting: `ident()`, `table()`
* SQL-like builders: `toSelect()`, `toWhere()`, `toSort()`, `toLimit()`
* binding: `bind()`, `bindCriteria()`, `unbind()`, `formatBinds()`
* schema ops on `database.schema.create(name, schema)` and `delete()`

Drivers adapt these to their backends (SQL, Mongo queries).

## Typical project layout

```
config/
  db/
    index.ts            # default db (or default.ts, or single file)
    postgresql.ts       # extra named dbs as needed
stores/
  Post.ts               # DatabaseStore, may pin a specific db
  Custom.ts             # custom module using db directly
```
