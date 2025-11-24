---
title: Add a Go backend
---

Add Go routes with the `@primate/go` module. Write handlers in Go; Primate
compiles them to WebAssembly and wires them like JS routes.

!!!
Make sure the Go executable is available in your `PATH`. Primate needs it to
compile your routes to WebAssembly.
!!!

---

### 1) Install

Install the Primate Go package.

[s=guides/backends/add-a-go-backend/install]

---

### 2) Configure

Load the Go module in your configuration.

[s=guides/backends/add-a-go-backend/configure]

---

### 3) Write a route

Compose a route in Go.

[s=guides/backends/add-a-go-backend/write-a-route]
