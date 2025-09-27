---
name: Use React components
---

Add React components with the `@primate/react` module.

### 1) Install

Install the Primate React package along with React and React DOM.

```sh
npm i @primate/react react react-dom
```

### 2) Configure

Load the React module in your configuration.

```ts
import config from "primate/config";
import react from "@primate/react";
export default config({ modules: [react()] });
```

### 3) Write a component

Compose a component in JSX or TSX.

```tsx
// components/Welcome.tsx
export default function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.tsx", { name: "World" }));
```
