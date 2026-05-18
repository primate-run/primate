---
title: Use MongoDB
---

Add MongoDB as a database with the `@primate/mongodb` module. Configure it in
`config/db`; Primate connects to it and provides a unified API.

!!!
Ensure MongoDB is running and accessible.
!!!

---

### 1) Install

Install the Primate MongoDB package.

[s=guides/databases/use/mongodb/install]

---

### 2) Configure

Create a database configuration file.

[s=guides/databases/use/mongodb/configure]

---

### 3) Create a store

MongoDB stores abstract a collection. Give the store a name and wire the
database.

[s=guides/databases/use/shared/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use/shared/use-the-store]
