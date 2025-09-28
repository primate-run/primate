---
name: Use Handlebars templates
---

Add Handlebars templating with the `@primate/handlebars` module.

---

### 1) Install

Install the Primate Handlebars package.

```sh
npm i @primate/handlebars
```

---

### 2) Configure

Load the Handlebars module in your configuration.

```ts
import config from "primate/config";
import handlebars from "@primate/handlebars";
export default config({ modules: [handlebars()] });
```

---

### 3) Write a template

Compose a template in Handlebars.

```hbs
<!-- components/Welcome.hbs -->
<h1>Hello, {{name}}!</h1>
```

---

### 4) Render the template

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.hbs", { name: "World" }));
```
