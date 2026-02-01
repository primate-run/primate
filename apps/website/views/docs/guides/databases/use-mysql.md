---
title: Use MySQL
---

Add MySQL as a database with the `@primate/mysql` module. Configure it in
`config/db`; Primate connects to it and provides a unified API.

!!!
Ensure MySQL is running and accessible.
!!!

---

### 1) Install

Install the Primate MySQL package.

```sh
npm install @primate/mysql
```

---

### 2) Configure

Create `config/db/index.ts` as a default database.

```ts
import mysql from "@primate/mysql";

export default mysql({
  database: "app",
  host: "localhost",
  port: 3306,
  // username: "user",
  // password: "pass",
});
```

---

### 3) Create a store

Stores used with MySQL abstract a table. The store will use MySQL
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
