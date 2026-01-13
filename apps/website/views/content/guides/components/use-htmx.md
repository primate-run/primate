---
title: Use HTMX
---

Add HTMX interactivity with the `@primate/htmx` module.

---

### 1) Install

Install the Primate HTMX package along with HTMX.

```sh
npm i @primate/htmx
```

---

### 2) Configure

Load the HTMX module in your configuration.

```ts
import config from "primate/config";
import htmx from "@primate/htmx";
export default config({ modules: [htmx()] });
```

---

### 3) Write a template

Compose a template in HTML with HTMX.

```html
<!-- components/Welcome.htmx -->
<h1>Hello, World!</h1>
<button hx-get="/api/greet" hx-target="#greeting">Greet</button>
<div id="greeting"></div>
```

---

### 4) Render the template

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.htmx"));
```
