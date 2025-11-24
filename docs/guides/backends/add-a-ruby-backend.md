---
title: Add a Ruby backend
---

Add Ruby routes with the `@primate/ruby` module. Write handlers in Ruby; Primate
compiles them to WebAssembly and wires them like JS routes.

!!!
Manage your Primate Ruby app as you would a normal Ruby project. Make sure you
install dependencies into `vendor` via
`bundle config set --local path 'vendor/bundle'`, so Primate can pick them up.
!!!

---

### 1) Install

Install the Primate Ruby package as well as the `primate-run` gem.

[s=guides/backends/add-a-ruby-backend/install]

---

### 2) Configure

Load the Ruby module in your configuration.

[s=guides/backends/add-a-ruby-backend/configure]

---

### 3) Write a route

Compose a route in Ruby.

[s=guides/backends/add-a-ruby-backend/write-a-route]
