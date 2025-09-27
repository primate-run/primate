---
name: Use HTML
---

Add HTML templates with the `@primate/html` module.

### 1) Install

Install the Primate HTML package.

```sh
npm i @primate/html
```

### 2) Configure

Load the HTML module in your configuration.

```ts
import config from "primate/config";
import html from "@primate/html";
export default config({ modules: [html()] });
```

### 3) Write a template

Compose a template in HTML.

```html
<!-- components/Welcome.html -->
<h1>Hello, World!</h1>
```

### 4) Render the template

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.html"));
```
