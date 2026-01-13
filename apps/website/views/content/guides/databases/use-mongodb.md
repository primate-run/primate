---
title: Use MongoDB
---

Add MongoDB as a database with the `@primate/mongodb` module. Configure it in
`config/database`; Primate connects to it and provides a unified API.

!!!
Ensure MongoDB is running and accessible.
!!!

---

### 1) Install

Install the Primate MongoDB package.

[s=guides/databases/use-mongodb/install]

---

### 2) Configure

Create `config/database/index.ts` as a default database.

[s=guides/databases/use-mongodb/configure]

---

### 3) Create a store

Stores used with MongoDb abstract a collection. The store will use MongoDB
automatically, being the default database.

[s=guides/databases/use-mongodb/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use-mongodb/use-the-store]
