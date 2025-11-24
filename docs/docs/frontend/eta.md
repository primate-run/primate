---
title: Eta frontend
---

# Eta

Primate runs [Eta][Documentation] templates with server-side rendering and props
mapped to template variables.

## Setup

### Install

```bash
npm install @primate/eta
```

### Configure

```ts
import config from "primate/config";
import eta from "@primate/eta";

export default config({
  modules: [eta()],
});
```

## Templates

Create Eta templates in `components`.

```html
<!-- components/post-index.eta -->
<h1>All posts</h1>
<div>
<% it.posts.forEach(function(post){ %>
  <h2><a href="/post/view/<%= post.id %>"><%= post.title %></a></h2>
<% }) %>
</div>
```

Serve the template from a route:

```ts
// routes/posts.ts
import response from "primate/response/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    { id: 1, title: "First Post" },
    { id: 2, title: "Second Post" },
  ];

  return response.view("post-index.eta", { posts });
});
```

## Props

Props passed to `response.view` are available in templates as `it`.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  return response.view("user.eta", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the template:

```html
<!-- components/user.eta -->
<div>
  <h2><%= it.user.name %></h2>
  <p>Role: <%= it.user.role %></p>
  <ul>
    <% it.permissions.forEach(function(permission){ %>
    <li><%= permission %></li>
    <% }) %>
  </ul>
</div>
```

## Configuration

| Option         | Type       | Default    | Description                |
| -------------- | ---------- | ---------- | -------------------------- |
| fileExtensions | `string[]` | `[".eta"]` | Associated file extensions |

### Example

```ts
import eta from "@primate/eta";
import config from "primate/config";

export default config({
  modules: [
    eta({
      // add `.eta.html` to associated file extensions
      fileExtensions: [".eta", ".eta.html"],
    }),
  ],
});
```

## Resources

- [Documentation]

[Documentation]: https://eta.js.org
