# HTML

Primate runs HTML templates with server-side rendering and props mapped to
template literal variables.

## Setup

### Install

```bash
npm install @primate/html
```

### Configure

```ts
import config from "primate/config";
import html from "@primate/html";

export default config({
  modules: [html()],
});
```

## Templates

Create HTML templates in `components` using template literal syntax.

```html
<!-- components/post-index.html -->
<h1>All posts</h1>
${posts.map(post => `
  <h2>
    <a href="/post/${post.id}">
      ${post.title}
    </a>
  </h2>
`).join("")}
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

  return view("post-index.html", { posts });
});
```

## Props

Props passed via `view()` are available directly in templates as variables.

Pass props from a route:

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("user.html", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the template:

```html
<!-- components/user.html -->
<div>
  <h2>${user.name}</h2>
  <p>Role: ${user.role}</p>
  <ul>
    ${permissions.map(permission => `<li>${permission}</li>`).join("")}
  </ul>
</div>
```

## Component-Scoped Assets

HTML templates support `<style>` and `<script>` tags that are automatically
extracted and bundled into Primate's global `app.css` and `app.js` files.

```html
<!-- components/counter.html -->
<style>
  .counter {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .counter button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: #f9f9f9;
  }
</style>

<div class="counter">
  <button onclick="decrement()">-</button>
  <span id="count">${count}</span>
  <button onclick="increment()">+</button>
</div>

<script>
  function increment() {
    const span = document.getElementById('count');
    span.textContent = parseInt(span.textContent) + 1;
  }

  function decrement() {
    const span = document.getElementById('count');
    span.textContent = Math.max(0, parseInt(span.textContent) - 1);
  }
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
| fileExtensions | `string[]` | `[".html"]` | Associated file extensions |

### Example

```ts
import html from "@primate/html";
import config from "primate/config";

export default config({
  modules: [
    html({
      // add `.htm` to associated file extensions
      fileExtensions: [".html", ".htm"],
    }),
  ],
});
```
