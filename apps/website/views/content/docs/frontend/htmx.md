---
title: HTMX frontend
---

# HTMX

Primate runs [HTMX][Documentation] templates with server-side rendering and
props mapped to template literal variables.

## Setup

### Install

```bash
npm install @primate/htmx
```

### Configure

```ts
import config from "primate/config";
import htmx from "@primate/htmx";

export default config({
  modules: [htmx()],
});
```

## Templates

Create HTMX templates in `components` using template literal syntax with HTMX
attributes.

```html
<!-- components/post-index.htmx -->
<h1>All posts</h1>
${posts.map(post => `
  <h2>
    <a hx-get="/post/${post.id}" href="/post/${post.id}">
      ${post.title}
    </a>
  </h2>
`).join("")}
```

Serve the template from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    { id: 1, title: "First Post" },
    { id: 2, title: "Second Post" },
  ];

  return response.view("post-index.htmx", { posts });
});
```

!!!
When you use HTMX to fetch content, it sends its request with the `hx-request`
header set. This header is used to return the component HTML in
[partial mode](/docs/responses#partial). The example above thus works with or
without JavaScript.
!!!

## Props

Props passed to `response.view` are available directly in templates as
variables.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  return response.view("user.htmx", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the template:

```html
<!-- components/user.htmx -->
<div>
  <h2>${user.name}</h2>
  <p>Role: ${user.role}</p>
  <ul>
    ${permissions.map(permission => `<li>${permission}</li>`).join("")}
  </ul>
</div>
```

## Component-Scoped Assets

HTMX templates support `<style>` and `<script>` tags that are automatically
extracted and bundled into Primate's global `app.css` and `app.js` files.

```html
<!-- components/interactive-form.htmx -->
<style>
  .form-container {
    max-width: 400px;
    margin: 0 auto;
  }
  .loading {
    opacity: 0.5;
    pointer-events: none;
  }
</style>

<div class="form-container">
  <form hx-post="/submit" hx-target="#result">
    <input type="text" name="message" placeholder="Enter message">
    <button type="submit">Submit</button>
  </form>
  <div id="result"></div>
</div>

<script>
  // Custom HTMX event handlers
  document.body.addEventListener('htmx:beforeRequest', function(evt) {
    evt.target.classList.add('loading');
  });

  document.body.addEventListener('htmx:afterRequest', function(evt) {
    evt.target.classList.remove('loading');
  });
</script>
```

While the CSS and JavaScript appear local to the component, they are extracted
during build time and included in the global bundle.

## Escaping

All props are automatically HTML-escaped for security. To output raw HTML,
you'll need to handle it carefully in your template logic.

Use `\${...}` to output literal `${...}` text in templates:

```html
<!-- This renders: Learn about ${variable} syntax -->
<p>Learn about \${variable} syntax</p>
```

## Configuration

| Option         | Type       | Default     | Description                |
| -------------- | ---------- | ----------- | -------------------------- |
| fileExtensions | `string[]` | `[".htmx"]` | Associated file extensions |
| extensions     | `string[]` | `[]`        | HTMX extensions to load    |
| templates      | `string[]` | `[]`        | Client template engines    |

### Example

```ts
import htmx from "@primate/htmx";
import config from "primate/config";

export default config({
  modules: [
    htmx({
      // use the `client-side-templates` extension
      extensions: ["client-side-templates"],
      // with the `handlebars` template
      templates: ["handlebars"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Extensions](https://htmx.org/extensions)

[Documentation]: https://htmx.org
