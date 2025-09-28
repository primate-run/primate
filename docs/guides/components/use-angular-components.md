---
name: Use Angular components
---

Add Angular components with the `@primate/angular` module.

---

### 1) Install

Install the Primate Angular package and Angular.

```sh
npm install @primate/angular @angular/core @angular/common
```

---

### 2) Configure

Load the Angular module in your configuration.

```ts
import config from "primate/config";
import angular from "@primate/angular";
export default config({ modules: [angular()] });
```

---

### 3) Write a component

Compose a component in TypeScript.

```ts
// components/welcome.component.ts
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-welcome",
  template: `<h1>Hello, {{ name }}!</h1>`,
})
export class WelcomeComponent {
  @Input() name!: string;
}
```

---

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("welcome.component.ts", { name: "World" }));
```
