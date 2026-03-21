---
title: Use SQLite
---

Add SQLite as a database with the `@primate/sqlite` module. Configure it in
`config/db`; Primate connects to it and provides a unified API.

!!!
SQLite is file-based or in-memory, no server needed.
!!!

---

### 1) Install

Install the Primate SQLite package.

[s=guides/databases/use/sqlite/install]

---

### 2) Configure

Create a database configuration file.

[s=guides/databases/use/sqlite/configure]

---

### 3) Create a store

SQLite stores abstract a table. Give the store a name and wire the database.

[s=guides/databases/use/shared/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use/shared/use-the-store]
