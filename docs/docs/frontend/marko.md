# Marko

Primate runs [Marko][Documentation] components with server-side rendering and
props mapped to `input` variables.

## Setup

### Install

```bash
npm install @primate/marko
```

### Configure

```ts
import config from "primate/config";
import marko from "@primate/marko";

export default config({
  modules: [marko()],
});
```

## Components

Create Marko components in `components` using Marko's template syntax.

```marko
<!-- components/post-index.marko -->
<h1>All posts</h1>
<for|post| of=input.posts>
  <h2>
    <a href="/post/view/${post.id}">
      ${post.title}
    </a>
  </h2>
</for>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    { id: 1, title: "First Post" },
    { id: 2, title: "Second Post" },
  ];

  return response.view("post-index.marko", { posts });
});
```

## Props

Props passed to `response.view` are available as `input` in Marko components.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  return response.view("user.marko", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the component:

```marko
<!-- components/user.marko -->
<div>
  <h2>${input.user.name}</h2>
  <p>Role: ${input.user.role}</p>
  <ul>
    <for|permission| of=input.permissions>
      <li>${permission}</li>
    </for>
  </ul>
</div>
```

## Configuration

| Option         | Type       | Default       | Description                |
| -------------- | ---------- | ------------- | -------------------------- |
| fileExtensions | `string[]` | `[".marko"]`  | Associated file extensions |

### Example

```ts
import marko from "@primate/marko";
import config from "primate/config";

export default config({
  modules: [
    marko({
      // add `.marko.html` to associated file extensions
      fileExtensions: [".marko", ".marko.html"],
    }),
  ],
});
```

## Resources

- [Documentation]

[Documentation]: https://markojs.com
