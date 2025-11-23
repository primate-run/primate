---
name: Use SurrealDB
---

Add SurrealDB as a database with the `@primate/surrealdb` module. Configure it
in `config/database`; Primate connects to it and provides a unified API.

!!!
Ensure SurrealDB is running and accessible. Primate will otherwise default to
the ephemeral in-memory database.
!!!

---

### 1) Install

Install the Primate SurrealDB package.

```sh
npm install @primate/surrealdb
```

---

### 2) Configure

Create `config/database/index.ts` as a default database.

```ts
import surrealdb from "@primate/surrealdb";

export default surrealdb({
  database: "app",
  host: "localhost",
  port: 8000,
  // username: "user",
  // password: "pass",
});
```

---

### 3) Create a store

Stores used with SurrealDB abstract a table. The store will use SurrealDB
automatically, being the default database.

```ts
// stores/User.ts
import store from "primate/store";
import primary from "pema/primary";
import string from "pema/string";

export default store({
  id: primary,
  name: string,
  email: string.email(),
});
```

---

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
