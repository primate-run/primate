---
title: Angular frontend
---

# Angular

Primate runs [Angular][Documentation] with server-side rendering, hydration,
client navigation, layouts, validation and i18n.

Unlike most frontends that Primate runs, Angular is a full-stack framework. To
achieve parity with other frontends, Primate uses only the client portion and
provides the server implementation itself.

## Setup

### Install

```bash
npm install @primate/angular @angular/core @angular/common @angular/compiler
```

!!!
Install additional packages like `@angular/forms` as needed.
!!!

### Configure

```ts
import config from "primate/config";
import angular from "@primate/angular";

export default config({
  modules: [
    angular(),
  ],
});
```

## Components

Create Angular components in `views`.

```ts
// views/PostIndex.component.ts
import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <h1>{{ title() }}</h1>
    <article *ngFor="let post of posts()">
      <h2>{{ post.title }}</h2>
      @if (post.excerpt) {
        <p>{{ post.excerpt }}</p>
      }
    </article>
  `,
})
export default class PostIndex {
  title = input("Blog");
  posts = input<{ title: string; excerpt?: string }[]>([]);
}
```

!!!
Components only require a `selector` when referenced by tag from another
component's template. Pages rendered from routes and layouts are instantiated
programmatically and do not need a selector.

When referencing child components by tag (e.g., `<app-link>`), the child must
declare a selector and the parent must include the child in `imports: [Child]`.
Retain `CommonModule` when using `*ngFor`.
!!!

Serve the component from a route.

```ts
// routes/posts.ts
import PostIndex from "#view/PostIndex";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Angular" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view(PostIndex, { title: "Blog", posts });
  },
});
```

## Props

Props passed to `response.view` are mapped to `input()` signals inside Angular
components.

Pass props from a route:

```ts
import UserView from "#view/User";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(UserView, {
      user: { name: "John", role: "Developer" },
      permissions: ["read", "write"],
    });
  },
});
```

These props become `input()` properties in the component:

```ts
import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <div>
      <h2>{{ user().name }}</h2>
      <p>Role: {{ user().role }}</p>
      <ul>
        <li *ngFor="let permission of permissions()">{{ permission }}</li>
      </ul>
    </div>
  `,
})
export default class User {
  user = input();
  permissions = input<string[]>([]);
}
```

## Request

Import the `request` signal from `app:angular` to access the current request
inside any component. The signal updates automatically on client-side
navigation.

```ts
import { Component } from "@angular/core";
import { request } from "app:angular";

@Component({
  template: `<p>Current path: {{ request().url.pathname }}</p>`,
})
export default class Page {
  request = request;
}
```

The `request` signal exposes a `RequestPublic` object.

| Property  | Type           | Description             |
| --------- | -------------- | ----------------------- |
| `url`     | `URL`          | current request URL     |
| `query`   | `Dict<string>` | query string parameters |
| `headers` | `Dict<string>` | request headers         |
| `cookies` | `Dict<string>` | request cookies         |

## Reactivity with signals

Angular's signals provide fine-grained reactivity for state management and
computed values.

```ts
import { Component, signal, computed } from "@angular/core";

@Component({
  template: `
    <div>
      <button (click)="decrement()">-</button>
      <span>{{ count() }}</span>
      <button (click)="increment()">+</button>
      <p>Doubled: {{ doubled() }}</p>
    </div>
  `,
})
export default class Counter {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update(n => n + 1);
  }

  decrement() {
    this.count.update(n => n - 1);
  }
}
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```ts
import { Component, computed, input } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    <h2>Counter</h2>
    <button (click)="decrement()" [disabled]="c().loading()">-</button>
    <span>{{ c().value() }}</span>
    <button (click)="increment()" [disabled]="c().loading()">+</button>

    @if (c().error()) {
      <p style="color:red">{{ c().error().message }}</p>
    }
  `,
})
export default class Counter {
  id = input<string>("");
  counter = input<number>(0);
  c = computed(() => client.field(this.counter()).post(`/counter?id=${this.id()}`));

  increment() { this.c().update(n => n + 1); }
  decrement() { this.c().update(n => n - 1); }
}
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import CounterView from "#view/Counter";
import Counter from "#store/Counter";
import route from "primate/route";
import response from "primate/response";
import p from "pema";

await Counter.create();

export default route({
  async get() {
    const [existing] = await Counter.find({});
    const counter = existing ?? await Counter.insert({ value: 10 });

    return response.view(CounterView, {
      id: counter.id,
      counter: counter.value,
    });
  },
  async post(request) {
    const id = p.string.parse(request.query.get("id"));
    const body = p.loose({ value: p.number }).parse(await request.body.form());
    await Counter.update(id, { set: { value: body.value } });
    return null;
  },
});
```

The wrapper automatically tracks loading states, captures validation errors,
and posts updates on state changes.

## Forms

Use `client.form` from `@primate/angular` to wire forms to backend routes with
automatic field-level validation and error display.

```ts
// views/LoginForm.component.ts
import { Component, OnInit } from "@angular/core";
import client from "@primate/angular/client";
import route from "#route/login";

@Component({
  template: `
    @if (form) {
      <form [id]="form.id" method="post" (submit)="form.submit($event)">
        <input name="email" placeholder="Email" />
        @if (form.field('email').error()) {
          <p style="color: red;">{{ form.field('email').error() }}</p>
        }

        <input name="password" type="password" placeholder="Password" />
        @if (form.field('password').error()) {
          <p style="color: red;">{{ form.field('password').error() }}</p>
        }

        @if (form.errors().length) {
          <p style="color: red;">{{ form.errors()[0] }}</p>
        }

        <button type="submit" [disabled]="form.submitting()">
          {{ form.submitting() ? "Submitting..." : "Submit" }}
        </button>
      </form>
    }
  `,
})
export default class LoginForm implements OnInit {
  form!: ReturnType<typeof client.form>;

  ngOnInit() {
    this.form = client.form(route.post, {
      initial: { email: "", password: "" },
    });
  }
}
```

Add the corresponding route:

```ts
// routes/login.ts
import LoginForm from "#view/LoginForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(LoginForm);
  },
  post: route.with({
    contentType: "application/json",
    body: p({ email: p.string.email(), password: p.string.min(8) }),
  }, async request => {
    const { email, password } = await request.body.json();

    // implement authentication logic

    return null;
  }),
});
```

Validation errors from the server are automatically surfaced per-field via
`form.field(name).error()`. The `form.submitting()` signal disables the submit
button while the request is in flight.

### Form API

| Property           | Type                  | Description                         |
| ------------------ | --------------------- | ----------------------------------- |
| `form.id`          | `string`              | Unique form ID for the `id` attr    |
| `form.submit`      | `(event?) => Promise` | Submit handler for `(submit)`       |
| `form.submitting`  | `() => boolean`       | True while the request is in flight |
| `form.errors`      | `() => string[]`      | Form-level errors                   |
| `form.field(name)` | `Field`               | Access a named field                |

### Field API

| Property       | Type                 | Description                     |
| -------------- | -------------------- | ------------------------------- |
| `field.name`   | `string`             | Field name for the `name` attr  |
| `field.value`  | `T`                  | Initial field value             |
| `field.error`  | `() => string\|null` | First validation error or null  |
| `field.errors` | `() => string[]`     | All validation errors for field |

## Layouts

For SSR with hydration, layouts accept a `slot: TemplateRef` and render it
using `*ngTemplateOutlet`. Note that `slot` must remain as `@Input()` since it
is a template reference passed internally by Angular, not a regular prop.

Create a layout view:

```ts
// views/Layout.component.ts
import { Component, Input, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <ng-container *ngTemplateOutlet="slot"></ng-container>
    </main>

    <footer>© 1996 My App</footer>
  `,
})
export default class Layout {
  @Input({ required: true }) slot!: TemplateRef<unknown>;
}
```

Next, register the layout using a `+layout.ts` file:

```ts
// routes/+layout.ts
import Layout from "#view/Layout";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Layout);
  },
});
```

### Passing Props to Layouts

```ts
// views/Layout.component.ts
import { Component, Input, TemplateRef, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <header>
      <h1>{{ brand() }}</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <ng-container *ngTemplateOutlet="slot"></ng-container>
    </main>
  `,
})
export default class Layout {
  @Input({ required: true }) slot!: TemplateRef<unknown>;
  brand = input("My App");
}
```

```ts
// routes/+layout.ts
import Layout from "#view/Layout";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Layout, { brand: "Primate Angular Demo" });
  },
});
```

## Internationalization

Primate's `t` function is framework-agnostic. In Angular, call it directly:

```ts
import { Component } from "@angular/core";
import t from "#i18n";

@Component({
  template: `
    <h1>{{ t("welcome") }}</h1>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
    <p>{{ t("current_locale") }}: {{ currentLocale() }}</p>
  `,
})
export default class Welcome {
  t = (key: string) => t(key);

  setLocale(locale: string) {
    t.locale.set(locale);
  }

  currentLocale() {
    return t.locale.get();
  }
}
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Angular's `Title` and `Meta` to dynamically set page titles and meta tags.

```ts
import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";

@Component({
  template: "<h1>{{ pageTitle }}</h1>",
})
export default class Page implements OnInit {
  pageTitle = "About Us";
  title = inject(Title);
  meta = inject(Meta);

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this.meta.addTag({ name: "description", content: "Learn more about us" });
    this.meta.addTag({ property: "og:title", content: this.pageTitle });
  }
}
```

## Configuration

| Option     | Type       | Default             | Description                  |
| ---------- | ---------- | ------------------- | ---------------------------- |
| extensions | `string[]` | `[".component.ts"]` | Associated file extensions   |
| ssr        | `boolean`  | `true`              | Enable server-side rendering |
| csr        | `boolean`  | `true`              | Enable client-side rendering |

### Example

```ts
import config from "primate/config";
import angular from "@primate/angular";

export default config({
  modules: [
    angular({
      extensions: [".component.ts", ".ng.ts"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Components guide](https://angular.dev/guide/components)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Signals](https://angular.dev/guide/signals)

[Documentation]: https://angular.dev
