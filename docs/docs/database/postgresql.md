# PostgreSQL

PostgreSQL is a relational DBMS focused on correctness and extensibility.

## Setup

### Install

```bash
npm install @primate/postgresql
```

You need a running PostgreSQL server and a database/user with access.

### Configure

```ts
// config/database/index.ts
import postgresql from "@primate/postgresql";

export default postgresql({
  database: "app",
  // host: "localhost",
  // port: 5432,
  // username: "postgres",
  // password: "secret",
});
```

## Options

| option   | type     | default       | description     |
| -------- | -------- | ------------- | --------------- |
| database | `string` | —             | Database name   |
| host     | `string` | `"localhost"` | PostgreSQL host |
| port     | `number` | `5432`        | PostgreSQL port |
| username | `string` | —             | Username        |
| password | `string` | —             | Password        |
