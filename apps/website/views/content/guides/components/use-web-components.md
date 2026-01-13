---
title: Use Web Components
---

Add Web Components with the `@primate/web-components` module.

!!!
Web Components are client-side only.
!!!

---

### 1) Install

Install the Primate Web Components package.

```sh
npm i @primate/web-components
```

---

### 2) Configure

Load the Web Components module in your configuration.

```ts
import config from "primate/config";
import webComponents from "@primate/web-components";
export default config({ modules: [webComponents()] });
```

---

### 3) Write a component

Compose a component as a custom element.

```ts
<script>
  import Component from "@primate/webc/Component";

  export default class Welcome extends Component {
    render() {
      const { name } = this.props;

      return `Hello, ${name}!`;
    }
  }
</script>

```

---

### 4) Render the component

Use `response.view` in a route to render the template.

```ts
// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.webc", { name: "World" }));
```
