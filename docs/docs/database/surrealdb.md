# SurrealDB

SurrealDB is a multi-model database (document + graph + SQL-like queries).
The Primate driver can connect to a remote server **or** run an embedded,
in-memory engine via Surreal's WASM Node runtime.

## Setup

### Install

```bash
npm install @primate/surrealdb
```

If you point the driver to a running SurrealDB server, have it installed and
running. If you leave the connection unset, the driver runs **embedded**
(in-memory).

### Configure

```ts
// config/database/index.ts
import surrealdb from "@primate/surrealdb";

export default surrealdb({
  database: "app",
  // Remote server (uncomment to use a DBMS):
  // host: "http://localhost",
  // port: 8000,
  // path: "/rpc",
  // namespace: "main",
  // username: "root",
  // password: "secret",
});
```

!!!
Omit the connection fields to use the embedded, in-memory engine.
!!!

## Options

| option    | type     | default              | description                     |
| --------- | -------- | -------------------- | ------------------------------- |
| database  | `string` | —                    | Database name                   |
| host      | `string` | `"http://localhost"` | Server host (omit for embedded) |
| port      | `number` | `8000`               | Server port                     |
| path      | `string` | `"/rpc"`             | RPC path                        |
| namespace | `string` | —                    | Namespace                       |
| username  | `string` | —                    | Username                        |
| password  | `string` | —                    | Password                        |
