---
title: Use SQLite
---

Add SQLite as a database with the `@primate/sqlite` module. Configure it in
`config/database`; Primate connects to it and provides a unified API.

!!!
SQLite is file-based or in-memory, no server needed.
!!!

---

### 1) Install

Install the Primate SQLite package.

```sh
npm install @primate/sqlite
```

---

### 2) Configure

Create `config/database/index.ts` as a default database.

```ts
import sqlite from "@primate/sqlite";

export default sqlite({
  database: "/tmp/app.db", // or ":memory:" for in-memory
});
```

---

### 3) Create a store

Stores used with SQLite abstract a table. The store will use SQLite
automatically, being the default database.

```ts
// stores/User.ts
import store from "primate/store";
import p from "pema";

export default store({
  id: p.primary,
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
