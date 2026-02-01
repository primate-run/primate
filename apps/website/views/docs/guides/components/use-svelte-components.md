---
title: Use Svelte components
---

Add Svelte components with the `@primate/svelte` module.

---

### 1) Install

Install the Primate Svelte package along with Svelte.

```sh
npm i @primate/svelte svelte
```

---

### 2) Configure

Load the Svelte module in your configuration.

```ts
import config from "primate/config";
import svelte from "@primate/svelte";
export default config({ modules: [svelte()] });
```

---

### 3) Write a component

Compose a component in Svelte.

```svelte
<!-- components/Welcome.svelte -->
<script>
  export let name;
</script>

<h1>Hello, {name}!</h1>
```

---

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.svelte", { name: "World" }));
```
