---
title: Supported platforms
---

# Platforms

Primate runs on **Node**, **Bun**, and **Deno** via `rcompat`. It avoids
runtime-specific APIs and abstracts differences via `rcompat`. You build
and run with your chosen runtime, and target **Web** or **Native**.

## Why `rcompat`

Using `rcompat` keeps apps portable and future-proof:

* No vendor lock-in to a single runtime
* One codebase, three runtimes
* Unified stable interfaces insulate you from runtime churn
* Matches Primate's stance elsewhere (frontend, backend, database agnostic)

## Run

### Dev

```bash
# Node
npx primate

# Bun
bunx --bun primate

# Deno
deno run -A npm:primate
```

### Build

```bash
# Node
npx primate build

# Bun
bunx --bun primate build

# Deno
deno run -A npm:primate build
```

### Serve a Build

```bash
# Node
npx primate serve

# Bun
bunx --bun primate serve

# Deno
deno run -A npm:primate serve
```

## Unified APIs with `rcompat`

Prefer `rcompat` packages over runtime-specific APIs.

### Filesystem

```ts
import FileRef from "@rcompat/fs/FileRef";

const base = new FileRef("static");
const file = base.join("logo.svg");
```

### HTTP Status

```ts
import Status from "@rcompat/http/Status";

return new Response("ok", { status: Status.OK });
```

### MIME Types

```ts
import mime from "@rcompat/mime/text/plain";
import resolve from "@rcompat/mime/resolve";

const known = mime;            // "text/plain"
const byExt = resolve(".svg"); // "image/svg+xml"
```

## Runtime Support

Primate aims for complete interoperability across various runtimes
and targets. In the table below, some cells are left blank where
a platform has not yet been wired up.

### Build Targets

| Target                | Node | Deno | Bun |
| --------------------- | ---- | ---- | --- |
| Web                   | ✓    | ✓    | ✓   |
| Desktop (linux-x64)   |      |      | ✓   |
| Desktop (darwin-x64)  |      |      |     |
| Desktop (darwin-arm64)|      |      |     |
| Desktop (windows-x64) |      |      | ✓   |

### Backends

| Backend      | Node | Deno | Bun (web) | Bun (native) |
| ------------ | ---- | ---- | --------- | ------------ |
| [Go]         | ✓    | ✓    |           |              |
| [Python]     | ✓    | ✓    |           |              |
| [Ruby]       | ✓    |      |           |              |
| [TypeScript] | ✓    | ✓    | ✓         | ✓            |

### Databases

| Database     | Node | Deno | Bun (web) | Bun (native) |
| ------------ | ---- | ---- | --------- | ------------ |
| [MongoDB]    | ✓    | ✓    | ✓         |              |
| [MySQL]      | ✓    | ✓    | ✓         |              |
| [PostgreSQL] | ✓    | ✓    | ✓         |              |
| [SQLite]     | ✓    |      | ✓         | ✓            |
| [SurrealDB]  | ✓    | ✓    | ✓         | ✓            |

[Go]: /docs/backend/go
[Python]: /docs/backend/python
[Ruby]: /docs/backend/ruby
[TypeScript]: /docs/backend/typescript
[MongoDB]: /docs/database/mongodb
[MySQL]: /docs/database/mysql
[PostgreSQL]: /docs/database/postgresql
[SQLite]: /docs/database/sqlite
[SurrealDB]: /docs/database/surrealdb
