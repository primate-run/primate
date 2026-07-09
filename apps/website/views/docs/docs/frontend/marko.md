---
title: Marko frontend
---

# Marko

Primate runs [Marko][Documentation] with server-side rendering, hydration,
client navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/marko marko
```

### Configure

```ts
import config from "primate/config";
import marko from "@primate/marko";

export default config({
  modules: [
    marko(),
  ],
});
```

## Components

Create Marko components in `views`.

```marko
// views/PostIndex.marko
export interface Input {
  title: string;
  posts: { title: string; excerpt?: string }[];
}

<h1>${input.title}</h1>
<article>
  <for|post| of=input.posts>
    <div>
      <h2>${post.title}</h2>
      <if=post.excerpt>
        <p>${post.excerpt}</p>
      </if>
    </div>
  </for>
</article>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Marko" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.marko", { title: "Blog", posts });
  },
});
```

## Props

Props passed to `response.view` are available as `input` in Marko views.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("User.marko", {
      user: { name: "John", role: "Developer" },
      permissions: ["read", "write"],
    });
  },
});
```

Access the props in the view:

```marko
// views/User.marko
export interface Input {
  user: { name: string; role: string };
  permissions: string[];
}

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

## Request

Import the `request` object from `app:marko` to access the current request
inside any component. It updates automatically on client-side navigation.

```marko
import { request } from "app:marko";

<p>Current path: ${request.url.pathname}</p>
```

The `request` object exposes a `RequestPublic` object.

| Property  | Type           | Description             |
| --------- | -------------- | ----------------------- |
| `url`     | `URL`          | current request URL     |
| `query`   | `Dict<string>` | query string parameters |
| `headers` | `Dict<string>` | request headers         |
| `cookies` | `Dict<string>` | request cookies         |

## Reactivity

Marko's reactive `<let>` and `<const>` tags provide fine-grained state
management and computed values.

```marko
<let/count=0/>
<const/doubled=() => count * 2/>

<div>
  <button onClick() { count-- }>-</button>
  <span>${count}</span>
  <button onClick() { count++ }>+</button>
  <p>Doubled: ${doubled()}</p>
</div>
```

## Validation

Use Primate's `<Field>` tag from `@primate/marko/tags` to synchronize state
with backend routes.

```marko
// views/Counter.marko
import { Field } from "@primate/marko/tags";

export interface Input {
  id: number;
  counter: number;
}

<Field/counter value=input.counter method="post" url=`/counter?id=${input.id}`/>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>

  <div>
    <button onClick() { counter.update(n => n - 1); } disabled=counter.loading>
      -
    </button>

    <span style="margin: 0 1rem;">${counter.value}</span>

    <button onClick() { counter.update(n => n + 1); } disabled=counter.loading>
      +
    </button>
  </div>

  <if=counter.error>
    <p style="color: red; margin-top: 1rem;">
      ${counter.error.message}
    </p>
  </if>
</div>
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import Counter from "@/stores/Counter";
import route from "primate/route";
import response from "primate/response";
import p from "pema";

await Counter.create();

export default route({
  async get() {
    const counters = await Counter.find({});

    const counter = counters.length === 0
      ? await Counter.insert({ counter: 10 })
      : counters[0];

    return response.view("Counter.marko", counter);
  },
  async post(request) {
    const id = p.loose.u32.parse(request.query.get("id"));
    const counter = p.loose.number.parse(await request.body.json());
    await Counter.update(id, { set: { counter } });
    return null;
  },
});
```

The `<Field>` tag automatically tracks loading states, captures validation
errors, and posts updates on state changes.

## Forms

Use Primate's `<Form>` tag from `@primate/marko/tags` to wire forms to backend
routes with automatic field-level validation and error display.

```marko
// views/LoginForm.marko
import { Form } from "@primate/marko/tags";

<Form/form initial={ email: "", password: "" } />
<const/email=form.field("email")/>
<const/password=form.field("password")/>

<form
  method="post"
  action="/login"
  id=form.id
  onSubmit=form.submit
>
  <if=form.errors.length>
    <p style="color: red">${form.errors[0]}</p>
  </if>

  <div>
    <input type="email" name=email.name value=email.value placeholder="Email" />
    <if=email.error>
      <p style="color: red">${email.error}</p>
    </if>
  </div>

  <div>
    <input type="password" name=password.name value=password.value placeholder="Password" />
    <if=password.error>
      <p style="color: red">${password.error}</p>
    </if>
  </div>

  <button type="submit" disabled=form.submitting>
    ${form.submitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

Add the corresponding route:

```ts
// routes/login.ts
import route from "primate/route";
import response from "primate/response";
import p from "pema";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

export default route({
  get() {
    return response.view("LoginForm.marko");
  },
  async post(request) {
    const body = LoginSchema.parse(await request.body.form());

    // implement authentication logic

    return null;
  },
});
```

Validation errors from the server are automatically surfaced per-field via
`form.field(name).error`. The `form.submitting` flag disables the submit
button while the request is in flight.

### Form API

| Property           | Type                  | Description                         |
| ------------------ | --------------------- | ----------------------------------- |
| `form.id`          | `string`              | Unique form ID for the `id` attr    |
| `form.submit`      | `(event?) => Promise` | Submit handler for `onSubmit`       |
| `form.submitting`  | `boolean`             | True while the request is in flight |
| `form.submitted`   | `boolean`             | True after a successful submission  |
| `form.errors`      | `string[]`            | Form-level errors                   |
| `form.field(name)` | `Field`               | Access a named field                |

### Field API

| Property       | Type           | Description                     |
| -------------- | -------------- | ------------------------------- |
| `field.name`   | `string`       | Field name for the `name` attr  |
| `field.value`  | `T`            | Initial field value             |
| `field.error`  | `string\|null` | First validation error or null  |
| `field.errors` | `string[]`     | All validation errors for field |

## Layouts

Create layout components that wrap your pages using `input.content`.

```marko
// views/Layout.marko
export interface Input {
  content: Marko.Body;
}

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  <${input.content}/>
</main>

<footer>© 1996 My App</footer>
```

Next, register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Layout.marko", { brand: "Primate Marko Demo" });
  },
});
```

Pages under this route subtree render inside the layout via `input.content`.

## Internationalization

Create an i18n bridge file that adapts Primate's headless translator to Marko's
reactivity model:

```ts
// lib/i18n.ts
import app from "@/config/app";
import i18n from "@primate/marko/i18n";

export default i18n(app.i18n);
```

Import and use the bridged translator directly in views:

```marko
// views/i18n/Index.marko
import t from "@/lib/i18n";

<span>${t.locale.get()}</span>
<span>${t("title")}</span>

<button onClick() { t.locale.set("de-DE") }>
  ${t("german")}
</button>

<button onClick() { t.locale.set("en-US") }>
  ${t("english")}
</button>
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Configuration

| Option     | Type       | Default      | Description                  |
| ---------- | ---------- | ------------ | ---------------------------- |
| extensions | `string[]` | `[".marko"]` | Associated file extensions   |
| ssr        | `boolean`  | `true`       | Enable server-side rendering |
| csr        | `boolean`  | `true`       | Enable client-side rendering |

### Example

```ts
import marko from "@primate/marko";
import config from "primate/config";

export default config({
  modules: [
    marko({
      // add `.marko.html` to associated file extensions
      extensions: [".marko", ".marko.html"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Language guide](https://markojs.com/docs/syntax/)
- [Reactivity](https://markojs.com/docs/reactivity/)

[Documentation]: https://markojs.com
