# Voby

Primate runs [Voby][Documentation] with server-side rendering.

## Setup

### Install

```bash
npm install @primate/voby
```

### Configure

```ts
import config from "primate/config";
import voby from "@primate/voby";

export default config({
  modules: [voby()],
});
```

## Components

Create Voby components in `components` using JSX syntax.

```jsx
// components/post-index.jsx
export default ({ posts, title }) => {
  return (
    <>
      <h1>{title}</h1>
      {posts.map(({ id, title }) => (
        <h2 key={id}>
          <a href={`/post/view/${id}`}>{title}</a>
        </h2>
      ))}
    </>
  );
};
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

  return response.view("post-index.jsx", { posts, title: "Blog" });
});
```

## Props

Props passed to `response.view` are available as component parameters.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  return response.view("user.jsx", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the component:

```jsx
// components/user.jsx
export default ({ user, permissions }) => {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Role: {user.role}</p>
      <ul>
        {permissions.map((permission, i) => (
          <li key={i}>{permission}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Configuration

| Option         | Type       | Default            | Description                  |
| -------------- | ---------- | ------------------ | ---------------------------- |
| fileExtensions | `string[]` | `[".tsx", ".jsx"]` | Associated file extensions   |
| ssr            | `boolean`  | `true`             | Active server-side rendering |
| spa            | `boolean`  | `true`             | Active client-browsing       |

### Example

```ts
import voby from "@primate/voby";
import config from "primate/config";

export default config({
  modules: [
    voby({
      // add .voby.tsx to associated file extensions
      fileExtentions: [".jsx", ".tsx", ".voby.tsx"],
    }),
  ],
});
```

## Resources

- [Documentation]

[Documentation]: https://github.com/vobyjs/voby
