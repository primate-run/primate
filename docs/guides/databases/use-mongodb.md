---
name: Use MongoDB
---

Add MongoDB as a database with the `@primate/mongodb` module. Configure it in
`config/database`; Primate connects to it and provides a unified API.

!!!
Ensure MongoDB is running and accessible.
!!!

### 1) Install

Install the Primate MongoDB package.

```sh
npm i @primate/mongodb
```

### 2) Configure

Create `config/database/index.ts` as a default database.

```ts
import mongodb from "@primate/mongodb";

export default mongodb({
  database: "app",
  host: "localhost",
  port: 27017,
  // username: "user",
  // password: "pass",
});
```

### 3) Create a store

Stores used with MongoDb abstract a collection. The store will use MongoDB
automatically, being the default database.

```ts
// stores/User.ts
import store from "primate/store";
import primary from "pema/primary";
import string from "pema/string";

export default store({
  id: primary,
  name: string,
  email: string,
});
```

### 4) Use the store

Use the store in routes.

```ts
// routes/users.ts
import route from "primate/route";
import User from "#store/User";

route.get(async () => {
  const users = await User.find({});
  return users;
});

route.post(async (request) => {
  const user = await User.insert(request.body);
  return user;
});
```
