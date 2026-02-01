---
title: Use PostgreSQL
---

Add PostgreSQL as a database with the `@primate/postgresql` module. Configure
it in `config/db`; Primate connects to it and provides a unified API.

!!!
Ensure PostgreSQL is running and accessible.
!!!

---

### 1) Install

Install the Primate PostgreSQL package.

```sh
npm install @primate/postgresql
```

---

### 2) Configure

Create `config/db/index.ts` as a default database.

```ts
import postgresql from "@primate/postgresql";

export default postgresql({
  database: "app",
  host: "localhost",
  port: 5432,
  // username: "user",
  // password: "pass",
});
```

---

### 3) Create a store

Stores used with PostgreSQL abstract a table. The store will use PostgreSQL
automatically, being the default database.

```ts
// stores/User.ts
import store from "primate/orm/store";
import key from "primate/orm/key";
import p from "pema";

export default store({
  id: key.primary(p.u32),
  name: p.string,
  email: p.string.email(),
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
