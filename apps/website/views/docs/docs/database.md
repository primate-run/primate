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
| [JSONDB](/docs/database/jsondb)         | JSON files     | document    |
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

## Typed bespoke SQL

For queries that don't fit the store API — complex joins, aggregates,
database-specific functions, or raw DDL — all four SQL drivers (SQLite, MySQL,
PostgreSQL, and OracleDB) expose `db.sql`:

```ts
import db from "#db";
import p from "pema";

const findByAge = db.sql({
  input: p({ age: p.u8 }),
  query: "SELECT name FROM users WHERE age > :age",
  output: p.array(p({ name: p.string })),
});

const results = await findByAge({ age: 18 });
```

`db.sql` returns a function. Named placeholders (`:age`) map to input schema
keys. TypeScript enforces at compile time that every placeholder has a matching
input key and vice versa. Input is validated against the input schema before
the query runs. Output is validated against the output schema after.

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

### Store schema interoperability

`db.sql` accepts a store's schema directly as input, letting you reuse your
existing type definitions without duplication:

```ts
import db from "#db";
import User from "#store/User";

const findByAge = db.sql({
  input: User.schema,
  query: "SELECT name FROM users WHERE age > :age",
  output: p.array(p({ name: p.string })),
});
```

TypeScript enforces that every required field in the store schema has a
matching placeholder in the query. Optional fields are exempt. If a required
field is missing from the query, the error tells you exactly which placeholders
are missing.

Placeholder translation is handled automatically per driver — SQLite uses
`$name`, MySQL uses `:name` natively, PostgreSQL and OracleDB translate to
positional parameters. You always write `:name` and the driver does the rest.

## Typical project layout

```
config/
  db.ts               # database configuration
stores/
  Post.ts             # store using #db
```
