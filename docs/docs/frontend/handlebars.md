# Handlebars

Primate runs [Handlebars][Documentation] templates with server-side rendering
and props mapped to template variables.

## Setup

### Install

```bash
npm install @primate/handlebars
```

### Configure

```ts
import config from "primate/config";
import handlebars from "@primate/handlebars";

export default config({
  modules: [handlebars()],
});
```

## Templates

Create Handlebars templates in `components` using Handlebars syntax.

```html
<!-- components/post-index.hbs -->
<h1>All posts</h1>
<div>
{{#each posts}}
  <h2><a href="/post/view/{{this.id}}">{{this.title}}</a></h2>
{{/each}}
</div>
```

Serve the template from a route:

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { id: 1, title: "First Post" },
    { id: 2, title: "Second Post" },
  ];

  return view("post-index.hbs", { posts });
});
```

## Props

Props passed via `view()` are available directly in templates as variables.

Pass props from a route:

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("user.hbs", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the template:

```html
<!-- components/user.hbs -->
<div>
  <h2>{{user.name}}</h2>
  <p>Role: {{user.role}}</p>
  <ul>
    {{#each permissions}}
    <li>{{this}}</li>
    {{/each}}
  </ul>
</div>
```

## Configuration

| Option         | Type       | Default    | Description                |
| -------------- | ---------- | ---------- | -------------------------- |
| fileExtensions | `string[]` | `[".hbs"]` | Associated file extensions |

### Example

```ts
import handlebars from "@primate/handlebars";
import config from "primate/config";

export default config({
  modules: [
    handlebars({
      // add `.handlebars` to associated extensions
      fileExtensions: [".hbs", ".handlebars"],
    }),
  ],
});
```

## Resources

- [Documentation]

[Documentation]: https://handlebarsjs.com
