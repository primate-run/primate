---
title: Use Voby components
---

Add Voby components with the `@primate/voby` module.

---

### 1) Install

Install the Primate Voby package along with Voby.

```sh
npm i @primate/voby voby
```

---

### 2) Configure

Load the Voby module in your configuration.

```ts
import config from "primate/config";
import voby from "@primate/voby";
export default config({ modules: [voby()] });
```

---

### 3) Write a component

Compose a component in JSX or TSX.

```tsx
// components/Welcome.tsx
import { $ } from "voby";

export default function Welcome({ name }: { name: string }) {
  return <h1>Hello, {$(name)}!</h1>;
}
```

---

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.tsx", { name: "World" }));
```
