# MongoDB

MongoDB is a document database with flexible schemas and rich querying.

## Setup

### Install

```bash
npm install @primate/mongodb
```

You need a running MongoDB server.

### Configure

```ts
// config/database/index.ts
import mongodb from "@primate/mongodb";

export default mongodb({
  database: "app",
  // host: "localhost",
  // port: 27017,
  // username: "mongo",
  // password: "secret",
});
```

## Options

| option   | type     | default       | description   |
| -------- | -------- | ------------- | ------------- |
| database | `string` | —             | Database name |
| host     | `string` | `"localhost"` | MongoDB host  |
| port     | `number` | `27017`       | MongoDB port  |
| username | `string` | —             | Username      |
| password | `string` | —             | Password      |
