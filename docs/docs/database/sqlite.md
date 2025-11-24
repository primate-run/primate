---
title: SQLite database
---

# SQLite

SQLite is an embedded relational database. It stores data in a single file, or
fully in memory for ephemeral use.

## Setup

### Install

```bash
npm install @primate/sqlite
```

### Configure

```ts
// config/database/index.ts
import sqlite from "@primate/sqlite";

export default sqlite({
  // database: ":memory:",        // in-memory (default)
  // database: "/var/data.db",     // file path (persists)
});
```

## Options

| option   | type     | default      | description                              |
| -------- | -------- | ------------ | ---------------------------------------- |
| database | `string` | `":memory:"` | Path to a database file, or `":memory:"` |

`":memory:"` uses an in-memory database. It does **not** persist across runs.
