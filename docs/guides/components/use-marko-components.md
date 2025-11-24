---
title: Use Marko components
---

Add Marko components with the `@primate/marko` module.

---

### 1) Install

Install the Primate Marko package.

```sh
npm i @primate/marko
```

---

### 2) Configure

Load the Marko module in your configuration.

```ts
import config from "primate/config";
import marko from "@primate/marko";
export default config({ modules: [marko()] });
```

---

### 3) Write a component

Compose a component in Marko.

```marko
<!-- components/Welcome.marko -->
<h1>Hello, ${input.name}!</h1>
```

---

### 4) Render the template

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.marko", { name: "World" }));
```
