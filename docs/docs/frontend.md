# Frontends

Primate supports multiple frontend frameworks and template engines. Use one or
mix them in the same app.

## Overview

| Frontend                    | SSR | Hydration | SPA | Layouts | Head | Validation | i18n |
| --------------------------- | --- | --------- | --- | ------- | ---- | ---------- | ---- |
| *Reactive frontends*        |     |           |     |         |      |            |      |
| [Angular]                   | ✓   | ✓         | ✓   | ✓       | ✓    | ✓          | ✓    |
| [React]                     | ✓   | ✓         | ✓   | ✓       | ✓    | ✓          | ✓    |
| [Solid]                     | ✓   | ✓         | ✓   | ✓       | ✓    | ✓          | ✓    |
| [Svelte]                    | ✓   | ✓         | ✓   | ✓       | ✓    | ✓          | ✓    |
| [Vue]                       | ✓   | ✓         | ✓   | ✓       | ✓    | ✓          | ✓    |
| *Component-based frontends* |     |           |     |         |      |            |      |
| [HTML]                      | ✓   |           |     |         |      |            |      |
| [HTMX]                      | ✓   |           |     |         |      |            |      |
| [Marko]                     | ✓   |           |     |         |      |            |      |
| [Voby]                      | ✓   |           |     |         |      |            |      |
| [Web Components]            |     | ✓         |     |         |      |            |      |
| *Template engines*          |     |           |     |         |      |            |      |
| [Eta]                       | ✓   |           |     |         |      |            |      |
| [Handlebars]                | ✓   |           |     |         |      |            |      |
| [Markdown]                  | ✓   |           |     |         |      |            |      |

[Angular]: /docs/frontend/angular
[React]: /docs/frontend/react
[Solid]: /docs/frontend/solid
[Svelte]: /docs/frontend/svelte
[Vue]: /docs/frontend/vue
[HTML]: /docs/frontend/html
[HTMX]: /docs/frontend/htmx
[Marko]: /docs/frontend/marko
[Voby]: /docs/frontend/voby
[Web Components]: /docs/frontend/web-components
[Eta]: /docs/frontend/eta
[Handlebars]: /docs/frontend/handlebars
[Markdown]: /docs/frontend/markdown

## Features

* **SSR** — render HTML on the server and send as the initial response
* **Hydration** — attach client code to SSR output for interaction
* **SPA** — client routing that swaps views without full page reloads
* **Layouts** — recursive wrappers with slots
* **Head** — programmatic control of `<head>` (title, meta, scripts)
* **Validation** — value/schema validation on client and server
* **i18n** — component-level translations

## Reactive frontends

*Angular*, *React*, *Solid*, *Svelte*, *Vue*

State-driven UI with SSR, hydration, routing, layouts, validation, and i18n in
one model. Suited for complex state and frequent interactions.

## Component-based frontends

*HTML*, *HTMX*, *Marko*, *Voby*, *Web Components*

Components without SPA routing. Works well for server-driven pages and simple
dashboards with minimal client JS.

## Template engines

*Handlebars*, *Eta*, *Markdown*

Static rendering for content-focused pages and templates. Good for docs, blogs,
emails, and CMS output.

## Quickstart

Install a frontend module:

```bash
npm install @primate/react react react-dom
```

Configure it:

```ts
// config/app.ts
import config from "primate/config";
import react from "@primate/react";

export default config({
  modules: [react()],
});
```

Create a component:

```tsx
// components/Welcome.tsx
export default function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

Render it in a route:

```ts
// routes/index.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Welcome.tsx", { name: "World" }));
```

## Mixing frontends

Multiple frontends can coexist; each handles its own files.

```ts
import config from "primate/config";
import react from "@primate/react";
import markdown from "@primate/markdown";
import htmx from "@primate/htmx";

export default config({
  modules: [react(), markdown(), htmx()],
});
```
