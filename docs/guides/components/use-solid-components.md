---
name: Use Solid components
---

Add Solid components with the `@primate/solid` module.

### 1) Install

Install the Primate Solid package along with Solid.

```sh
npm i @primate/solid solid-js
```

### 2) Configure

Load the Solid module in your configuration.

```ts
import config from "primate/config";
import solid from "@primate/solid";
export default config({ modules: [solid()] });
```

### 3) Write a component

Compose a component in JSX or TSX.

```tsx
// components/Welcome.tsx
import { Component } from "solid-js";

const Welcome: Component<{ name: string }> = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};

export default Welcome;
```

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.tsx", { name: "World" }));
```
