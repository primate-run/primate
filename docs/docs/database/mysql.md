# MySQL

MySQL is a relational DBMS. Use it for durable, multi-connection workloads.

## Setup

### Install

```bash
npm install @primate/mysql
```

You need a running MySQL server. Create a database and user with access.

### Configure

```ts
// config/database/index.ts
import mysql from "@primate/mysql";

export default mysql({
  database: "app",
  // host: "localhost",
  // port: 3306,
  // username: "root",
  // password: "secret",
});
```

## Options

| option   | type     | default       | description                     |
| -------- | -------- | ------------- | ------------------------------- |
| database | `string` | —             | Database name to use            |
| host     | `string` | `"localhost"` | MySQL host                      |
| port     | `number` | `3306`        | MySQL port                      |
| username | `string` | —             | Username (omit for socket auth) |
| password | `string` | —             | Password (omit if not required) |
