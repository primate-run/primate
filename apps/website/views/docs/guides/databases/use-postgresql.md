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

[s=guides/databases/use/postgresql/install]

---

### 2) Configure

Create a database configuration file.

[s=guides/databases/use/postgresql/configure]

---

### 3) Create a store

PostgreSQL stores abstract a table. Give the store a name and wire the database.

[s=guides/databases/use/shared/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use/shared/use-the-store]
