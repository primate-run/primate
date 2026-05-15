---
title: Use Oracle
---

Add Oracle as a database with the `@primate/oracle` module. Configure it in
`config/db`; Primate connects to it and provides a unified API.

!!!
Ensure Oracle is running and accessible.
!!!

---

### 1) Install

Install the Primate Oracle package.

[s=guides/databases/use/oracledb/install]

---

### 2) Configure

Create a database configuration file.

[s=guides/databases/use/oracledb/configure]

---

### 3) Create a store

Oracle stores abstract a table. Give the store a name and wire the database.

[s=guides/databases/use/shared/create-a-store]

---

### 4) Use the store

Use the store in routes.

[s=guides/databases/use/shared/use-the-store]
