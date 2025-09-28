---
name: Add a Grain backend
---

Add Grain routes with the `@primate/grain` module. Write handlers in Grain;
Primate compiles them to WebAssembly and wires them like JS routes.

!!!
Make sure the Grain executable is available in your `PATH`. Primate needs it to
compile your routes to WebAssembly.
!!!

---

### 1) Install

Install the Primate Grain package.

[s=guides/backends/add-a-grain-backend/install]

---

### 2) Configure

Load the Grain module in your configuration.

[s=guides/backends/add-a-grain-backend/configure]

---

### 3) Write a route

Compose a route in Grain.

[s=guides/backends/add-a-grain-backend/write-a-route]
