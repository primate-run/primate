---
name: Add a Ruby backend
---

Add Ruby routes with the `@primate/ruby` module. Write handlers in Ruby; Primate
compiles them to WebAssembly and wires them like JS routes.

!!!
Manage your Primate Ruby app as you would a normal Ruby project. Make sure you
install dependencies into `vendor` via
`bundle config set --local path 'vendor/bundle'`, so dass Primate can pick them
up.
!!!

### 1) Install

Install the Primate Ruby package as well as the `primate-run` gem.

```sh
npm i @primate/ruby && bundle install primate-run
```

### 2) Configure

Load the Ruby module in your configuration.

```ts
import config from "primate/config";
import ruby from "@primate/ruby";
export default config({ modules: [ruby()] });
```

### 3) Write a route

Compose a route in Ruby.

```rb
// routes/index.rb

require 'primate/route'

Route.get do |request|
  "Hello from Ruby"
end


Route.post do |request|
  { ok: true }
end
```
