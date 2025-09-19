# Web Components

Primate runs [Web Components][Documentation] with client-side rendering.

## Setup

### Install

```bash
npm install @primate/webc
```

### Configure

```ts
import config from "primate/config";
import webc from "@primate/webc";

export default config({
  modules: [webc()],
});
```

## Components

Create Web Components in `components` using Primate's Component class.

```html
<!-- components/post-index.webc -->
<script>
import Component from "@primate/webc/Component";

export default class PostIndex extends Component {
  mounted(root) {
    root.querySelector("h1").addEventListener("click",
      _ => console.log("title clicked!"));
  }

  render() {
    const { posts } = this.props;
    return `<h1>All posts</h1>
      ${posts.map(post =>
        `<h2><a href="/post/view/${post.id}">${post.title}</a></h2>`
      ).join("")}
    `;
  }
}
</script>
```

Serve the component from a route:

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { id: 1, title: "First Post" },
    { id: 2, title: "Second Post" },
  ];

  return view("post-index.webc", { posts });
});
```

## Props

Props passed via `view()` are available as `this.props` in the component.

Pass props from a route:

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("user.webc", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

Access the props in the component:

```html
<!-- components/user.webc -->
<script>
import Component from "@primate/webc/Component";

export default class User extends Component {
  render() {
    const { user, permissions } = this.props;
    return `
      <div>
        <h2>${user.name}</h2>
        <p>Role: ${user.role}</p>
        <ul>
          ${permissions.map(permission => `<li>${permission}</li>`).join("")}
        </ul>
      </div>
    `;
  }
}
</script>
```

## Lifecycle

Web Components support lifecycle methods for managing component state and
behavior.

```html
<!-- components/counter.webc -->
<script>
import Component from "@primate/webc/Component";

export default class Counter extends Component {
  mounted(root) {
    // Called when component is mounted on client
    console.log("Counter mounted");
  }

  render() {
    const { value } = this.props;
    return `
      <div>
        <button onclick="this.dispatchEvent(new CustomEvent('decrement'))">
          -
        </button>
        <span>${value}</span>
        <button onclick="this.dispatchEvent(new CustomEvent('increment'))">
          +
        </button>
      </div>
    `;
  }
}
</script>
```

## Configuration

| Option         | Type       | Default     | Description                |
| -------------- | ---------- | ----------- | -------------------------- |
| fileExtensions | `string[]` | `[".webc"]` | Associated file extensions |

### Example

```ts
import config from "primate/config";
import webc from "@primate/webc";

export default config({
  modules: [
    webc({
      // add `.webc.html` to associated file extensions
      extensions: [".webc", ".webc.html"],
    }),
  ],
});
```

## Resources

- [Documentation]

[Documentation]: https://www.webcomponents.org
