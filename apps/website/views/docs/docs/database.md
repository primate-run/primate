---
title: Using databases
---

# Databases

Databases back stores. Define one in your project, map it to a path alias in
`tsconfig.json`, and import it wherever you need it.

## Available databases

| Database                                | Storage        | Type        |
| --------------------------------------- | -------------- | ----------- |
| [MemoryDB](#memorydb)                   | in-memory      | relational  |
| [SQLite](/docs/database/sqlite)         | in-memory/file | relational  |
| [MySQL](/docs/database/mysql)           | DBMS           | relational  |
| [PostgreSQL](/docs/database/postgresql) | DBMS           | relational  |
| [OracleDB](/docs/database/oracle)       | DBMS           | relational  |
| [JSONDB](docs/database/jsondb)          | JSON files     | document    |
| [MongoDB](/docs/database/mongodb)       | DBMS           | document    |

## MemoryDB

For development, tests, or ephemeral use, Primate ships a built-in in-memory
database:

```ts
import memorydb from "primate/memorydb";

const db = memorydb();
```

MemoryDB requires no configuration and holds no state between instances. It is
particularly useful in test suites where you want a clean database per test.

## Setting up a database

Create a file for your database configuration and map it to a path alias in
`tsconfig.json`:

```ts
// config/db.ts
import postgresql from "@primate/postgresql";

export default postgresql({
  host: "localhost",
  port: 5432,
  database: "myapp",
  username: "myapp",
  password: "myapp",
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "#db": ["config/db.ts"]
    }
  }
}
```

The `#db` alias is conventional but not required — `@db`, `@/db`, or any other
alias you prefer works equally well.

## Using a database in a store

Import your database and pass it explicitly to the store:

```ts
import db from "#db";
import store from "primate/store";
import p from "pema";

export default store({
  table: "post",
  db,
  schema: {
    id: store.key.primary(p.u32),
    title: p.string,
  },
});
```

See the [stores](/docs/stores) page for the full store API.

## Using a database directly

You can bypass stores entirely and call the database driver directly when your
access pattern doesn't fit the store shape or you need full control:

```ts
import db from "#db";

export default new class Custom {
  async getAll() {
    return db.read(
      { table: "widget", types: { /* schema types */ } },
      { where: {} },
    );
  }
}();
```

## Typical project layout

```
config/
  db.ts               # database configuration
stores/
  Post.ts             # store using #db
```
