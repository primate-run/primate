---
name: Serve Markdown
---

Add Markdown rendering with the `@primate/markdown` module. Write content in
Markdown; Primate renders it to HTML on the server.

!!!
Markdown is converted to HTML for display.
!!!

---

### 1) Install

Install the Primate Markdown package.

```sh
npm i @primate/markdown
```

---

### 2) Configure

Load the Markdown module in your configuration.

```ts
import config from "primate/config";
import markdown from "@primate/markdown";
export default config({ modules: [markdown()] });
```

---

### 3) Write content

Compose content in Markdown.

```md
<!-- components/Welcome.md -->
# Hello, World!

This is **Markdown** content.
```

---

### 4) Render the content

Use `view()` in a route to render the Markdown.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.md"));
```
