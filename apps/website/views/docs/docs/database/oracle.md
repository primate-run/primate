---
title: Oracle
---

# Oracle

Oracle is a relational DBMS suited to transactional and enterprise workloads.

## Setup

### Install

```bash
npm install @primate/oracledb
```

Primate’s Oracle driver uses the npm `oracledb` driver. By default,
node-oracledb runs in Thin mode, so Oracle Client libraries are not required
unless you explicitly enable Thick mode.

### Requirements

This driver uses Oracle’s native `JSON` and SQL `BOOLEAN` column types. Native
`JSON` is available in Oracle 21c and later, while SQL `BOOLEAN` is available
in Oracle 23c / 23ai. In practice, use Oracle 23c / 23ai or newer for full
compatibility.

The configured database user must be able to connect to the database. If you
use migrations, it also needs permission to create, alter, and drop tables in
its schema.

### Configure

```ts
// config/db.ts
import oracledb from "@primate/oracledb";

export default oracledb({
  database: "FREEPDB1",
  // host: "localhost",
  // port: 1521,
  // username: "app",
  // password: "secret",
});
```

## Options

| option   | type     | default       | description          |
| -------- | -------- | ------------- | -------------------- |
| database | `string` | —             | Oracle service name  |
| host     | `string` | `"localhost"` | Oracle host          |
| port     | `number` | `1521`        | Oracle listener port |
| username | `string` | —             | Username             |
| password | `string` | —             | Password             |

## Notes

Primate connects using Oracle Easy Connect syntax in the form
`host:port/service`, so the `database` option should be the service name exposed
by your Oracle instance.
