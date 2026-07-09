---
title: Vue frontend
---

# Vue

Primate runs [Vue][Documentation] with server-side rendering, hydration, client
navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/vue vue
```

### Configure

```ts
import config from "primate/config";
import vue from "@primate/vue";

export default config({
  modules: [
    vue(),
  ],
});
```

## Components

Create Vue SFC components in `views`.

```vue
<!-- views/PostIndex.vue -->
<script lang="ts" setup>
interface Post {
  title: string;
  excerpt?: string;
}

interface Props {
  title: string;
  posts: Post[];
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <article>
      <div v-for="post in posts" :key="post.title">
        <h2>{{ post.title }}</h2>
        <p v-if="post.excerpt">{{ post.excerpt }}</p>
      </div>
    </article>
  </div>
</template>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Vue" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.vue", { title: "Blog", posts });
  },
});
```

## Props

Props passed to `response.view` map directly to component props.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("User.vue", {
      user: { name: "John", role: "Developer" },
      permissions: ["read", "write"],
    });
  },
});
```

Access the props in the component:

```vue
<!-- views/User.vue -->
<script lang="ts" setup>
interface User {
  name: string;
  role: string;
}

interface Props {
  user: User;
  permissions: string[];
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <h2>{{ user.name }}</h2>
    <p>Role: {{ user.role }}</p>
    <ul>
      <li v-for="permission in permissions" :key="permission">
        {{ permission }}
      </li>
    </ul>
  </div>
</template>
```

## Request

Import the `useRequest` composable from `app:vue` to access the current request
inside any component. The composable updates automatically on client-side
navigation.

```vue
<script lang="ts" setup>
import { useRequest } from "app:vue";

const request = useRequest();
</script>

<template>
  <p>Current path: {{ request.url.pathname }}</p>
</template>
```

The `useRequest` composable returns a `RequestPublic` object.

| Property  | Type           | Description             |
| --------- | -------------- | ----------------------- |
| `url`     | `URL`          | current request URL     |
| `query`   | `Dict<string>` | query string parameters |
| `headers` | `Dict<string>` | request headers         |
| `cookies` | `Dict<string>` | request cookies         |

## Reactivity with Composition API

Vue's Composition API provides reactive state management with `ref` and
`computed`.

```vue
<script lang="ts" setup>
import { ref, computed } from "vue";

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <div>
    <button @click="count--">-</button>
    <span>{{ count }}</span>
    <button @click="count++">+</button>
    <p>Doubled: {{ doubled }}</p>
  </div>
</template>
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```vue
<script lang="ts" setup>
import { computed } from "vue";
import client from "@primate/vue/client";

interface Props {
  id: string;
  counter: number;
}

const props = defineProps<Props>();
const counter = client.field(props.counter).post(`/counter?id=${props.id}`);
const loading = computed(() => counter.loading.value);
const error = computed(() => counter.error.value?.message);
</script>

<template>
  <div style="margin-top: 2rem; text-align: center;">
    <h2>Counter Example</h2>
    <div>
      <button @click="counter.update(n => n - 1)" :disabled="loading">
        -
      </button>

      <span style="margin: 0 1rem;">{{ counter.value }}</span>

      <button @click="counter.update(n => n + 1)" :disabled="loading">
        +
      </button>
    </div>

    <p v-if="counter.error" style="color: red; margin-top: 1rem;">
      {{ error }}
    </p>
  </div>
</template>
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

    return response.view("Counter.vue", {
      id: counter.id,
      counter: counter.counter,
    });
  },
  async post(request) {
    const id = p.string.parse(request.query.get("id"));
    const body = p.loose.number.parse(await request.body.json());
    await Counter.update(id, { set: { counter: body } });
    return null;
  },
});
```

The wrapper automatically tracks loading states, captures validation errors,
and posts updates on state changes.

## Forms

Use `client.form` from `@primate/vue/client` to wire forms to backend routes
with automatic field-level validation and error display.

```vue
<!-- views/LoginForm.vue -->
<script lang="ts" setup>
import client from "@primate/vue/client";

const form = client.form({ initial: { email: "", password: "" } });
</script>

<template>
  <form
    method="post"
    action="/login"
    :id="form.id"
    @submit="form.submit"
  >
    <p v-if="form.errors.length" style="color: red;">{{ form.errors[0] }}</p>

    <div style="margin-bottom: 1rem;">
      <input
        type="email"
        :name="form.field('email').name"
        :value="form.field('email').value"
        placeholder="Email"
      />
      <p v-if="form.field('email').error" style="color: red;">
        {{ form.field('email').error }}
      </p>
    </div>

    <div style="margin-bottom: 1rem;">
      <input
        type="password"
        :name="form.field('password').name"
        :value="form.field('password').value"
        placeholder="Password"
      />
      <p v-if="form.field('password').error" style="color: red;">
        {{ form.field('password').error }}
      </p>
    </div>

    <button type="submit" :disabled="form.submitting">
      {{ form.submitting ? "Submitting..." : "Submit" }}
    </button>
  </form>
</template>
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
    return response.view("LoginForm.vue");
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
| `form.submit`      | `(event?) => Promise` | Submit handler for `@submit`        |
| `form.submitting`  | `boolean`             | True while the request is in flight |
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

Create layout components that wrap your pages using `<slot>`.

```vue
<!-- views/Layout.vue -->
<script lang="ts" setup>
interface Props {
  brand?: string;
}

const props = withDefaults(defineProps<Props>(), {
  brand: "My App",
});
</script>

<template>
  <div>
    <header>
      <nav style="padding: 1rem; background-color: #f8f9fa;">
        <h1>{{ brand }}</h1>
        <a href="/" style="margin-right: 1rem;">Home</a>
        <a href="/about" style="margin-right: 1rem;">About</a>
      </nav>
    </header>

    <main style="padding: 2rem;">
      <slot />
    </main>

    <footer style="padding: 1rem; background-color: #f8f9fa; text-align: center;">
      © 1996 {{ brand }}
    </footer>
  </div>
</template>
```

Next, register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Layout.vue", { brand: "Primate Vue Demo" });
  },
});
```

Pages under this route subtree render inside the layout's `<slot>`.

## Internationalization

Create an i18n bridge file that adapts Primate's headless translator to Vue's
reactivity model:

```ts
// lib/i18n.ts
import app from "@/config/app";
import i18n from "@primate/vue/i18n";

export default i18n(app.i18n);
```

Import and use the bridged translator directly in views:

```vue
<script lang="ts" setup>
import t from "@/lib/i18n";
</script>

<template>
  <div>
    <h1>{{ t("welcome") }}</h1>
    <button @click="t.locale.set('en-US')">{{ t("english") }}</button>
    <button @click="t.locale.set('de-DE')">{{ t("german") }}</button>
    <p>{{ t("current_locale") }}: {{ t.locale.get() }}</p>
  </div>
</template>
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Vue's `onMounted` to manage document head elements.

```vue
<script lang="ts" setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "About Us - Primate Vue Demo";

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", "Learn more about our company");
  } else {
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Learn more about our company";
    document.head.appendChild(meta);
  }
});
</script>

<template>
  <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
    <h1>About Us</h1>
    <p>
      Welcome to our Primate Vue demo application. This page demonstrates
      how to manage document head elements including the title and meta tags
      for better SEO and social media sharing.
    </p>
  </div>
</template>
```

## Configuration

| Option     | Type       | Default    | Description                  |
| ---------- | ---------- | ---------- | ---------------------------- |
| extensions | `string[]` | `[".vue"]` | Associated file extensions   |
| ssr        | `boolean`  | `true`     | Enable server-side rendering |
| csr        | `boolean`  | `true`     | Enable client-side rendering |

### Example

```ts
import vue from "@primate/vue";
import config from "primate/config";

export default config({
  modules: [
    vue({
      // add `.component.vue` to associated file extensions
      extensions: [".vue", ".component.vue"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Single File Components](https://vuejs.org/guide/scaling-up/sfc.html)
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)

[Documentation]: https://vuejs.org
