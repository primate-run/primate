---
title: JSON Database
---

# JSON Database

JSON Database is a file-backed document database that persists data as JSON
files on disk. It is suited to lightweight local development and small
deployments that do not require a full DBMS.

## Setup

### Install

```bash
npm install @primate/jsondb
```

### Configure

```ts
// config/db.ts
import jsondb from "@primate/jsondb";

export default jsondb({
  // directory: "data",
});
```

## Options

| option    | type     | default  | description                           |
| --------- | -------- | -------- | ------------------------------------- |
| directory | `string` | `"data"` | Directory where JSON files are stored |

Each table is stored as a separate JSON file in the configured directory, named
after the table (e.g. `data/user.json`).

## Notes

JSON Database supports the full Primate store API including relations, field
projection, sorting, and limiting. It handles all Primate field types including
`bigint`, `blob`, `datetime`, and `url`, which are serialized to JSON using
type-tagged objects and revived on load.

JSON Database is not suited to high-concurrency workloads — it holds all table
data in memory and flushes to disk on every write. For production use, prefer
a dedicated DBMS such as PostgreSQL or MySQL.

## MemoryDB vs JSON Database

| Feature     | MemoryDB        | JSON Database         |
| ----------- | --------------- | --------------------- |
| Persistence | None            | File-backed           |
| Setup       | None            | Directory on disk     |
| Use case    | Tests, REPL     | Local dev, small apps |
