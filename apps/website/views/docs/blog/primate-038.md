---
title: Primate 0.38: Oracle database driver, YYY, and ZZZ
epoch: 1775417680816
author: terrablue
published: false
---

Today we're announcing the availability of the Primate 0.38 preview release.
This release adds an Oracle database driver, YYY, and ZZZ.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

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
`$gte`, `$lt`, `$lte`, `$ne`, `$before`, `$after`).

## YYY

## ZZZ

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
// this route now responds correctly to both GET and HEAD
route.get(() => response.json({ foo: "bar" }));
```

If you need a bespoke `HEAD` response, define an explicit handler and it takes
priority:
```ts
route.get(() => response.json({ foo: "bar" }));
route.head(() => new Response(null, { headers: { "x-custom": "bespoke" } }));
```

Routes that only define non-GET verbs correctly return 404 on HEAD.

## Raw database client access

Every database driver now exposes its underlying client via `db.client`.
This gives you a typed escape hatch for operations that fall outside
Primate's structured API — custom DDL, driver-specific features, or anything
else the abstraction does not cover.

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

## Breaking changes

### PostgreSQL: `datetime` now uses `TIMESTAMPTZ`

The `datetime` pema type previously mapped to `TIMESTAMP` (without timezone)
in PostgreSQL. In 0.38 it maps to `TIMESTAMPTZ` (timestamp with timezone).

This is the correct default — `TIMESTAMP` is a naive datetime that produces
incorrect results when the database server and application are in different
timezones. `TIMESTAMPTZ` stores the absolute moment in time unambiguously.

If you have existing `datetime` columns in PostgreSQL, create a migration with
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

Repeat the `ALTER TABLE` block for each table that has a `datetime` column.

## What's next

Check out our issue tracker for [upcoming features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[upcoming features]: https://github.com/primate-run/primate/milestone/11
