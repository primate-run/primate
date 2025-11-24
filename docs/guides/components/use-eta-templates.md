---
title: Use Eta templates
---

Add Eta templating with the `@primate/eta` module.

---

### 1) Install

Install the Primate Eta package.

```sh
npm i @primate/eta
```

---

### 2) Configure

Load the Eta module in your configuration.

```ts
import config from "primate/config";
import eta from "@primate/eta";
export default config({ modules: [eta()] });
```

---

### 3) Write a template

Compose a template in Eta.

```html
<!-- components/Welcome.eta -->
<h1>Hello, <%= it.name %>!</h1>
```

---

### 4) Render the template

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.eta", { name: "World" }));
```
