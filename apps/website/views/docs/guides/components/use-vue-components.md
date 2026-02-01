---
title: Use Vue components
---

Add Vue components with the `@primate/vue` module.

---

### 1) Install

Install the Primate Vue package along with Vue.

```sh
npm i @primate/vue vue
```

---

### 2) Configure

Load the Vue module in your configuration.

```ts
import config from "primate/config";
import vue from "@primate/vue";
export default config({ modules: [vue()] });
```

---

### 3) Write a component

Compose a component in Vue SFC.

```vue
<!-- components/Welcome.vue -->
<template>
  <h1>Hello, {{ name }}!</h1>
</template>

<script setup>
defineProps<{ name: string }>();
</script>
```

---

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.vue", { name: "World" }));
```
