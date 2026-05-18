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

[s=guides/databases/use/mysql/install]

---

### 2) Configure

Create a database configuration file.

[s=guides/databases/use/mysql/configure]

---

### 3) Create a store

MySQL stores abstract a table. Give the store a name and wire the database.

[s=guides/databases/use/shared/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use/shared/use-the-store]
