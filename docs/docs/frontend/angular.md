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
  modules: [angular()],
});
```

## Components

Create Angular components in `components`.

```ts
// components/PostIndex.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <h1>{{ title }}</h1>
    <article *ngFor="let post of posts">
      <h2>{{ post.title }}</h2>
      <p *ngIf="post.excerpt">{{ post.excerpt }}</p>
    </article>
  `,
})
export default class PostIndex {
  @Input() title = "Blog";
  @Input() posts: Array<{ title: string; excerpt?: string }> = [];
}
```

!!!
Components only require a `selector` when referenced by tag from another
component's template. Pages rendered from routes and layouts are instantiated
programmatically and do not need a selector.

When referencing child components by tag (e.g., `<app-link>`), the child must
declare a selector and the parent must include the child in `imports: [Child]`.
Retain `CommonModule` when using `*ngIf` or `*ngFor`.
!!!

Serve the component from a route.

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    {
      title: "First Post",
      excerpt: "Introduction to Primate with Angular"
    },
    {
      title: "Second Post",
      excerpt: "Building reactive applications"
    },
  ];

  return response.view("PostIndex.component.ts", { title: "Blog", posts });
});
```

## Props

Props passed to `response.view` are mapped to `@Input()`s inside Angular
components.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("User.component.ts", {
  user: { name: "John", role: "Developer" },
  permissions: ["read", "write"],
}));
```

These props become `@Input()` properties in the component:

```ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <div>
      <h2>{{ user.name }}</h2>
      <p>Role: {{ user.role }}</p>
      <ul>
        <li *ngFor="let permission of permissions">{{ permission }}</li>
      </ul>
    </div>
  `,
})
export default class User {
  @Input() user: any;
  @Input() permissions: string[] = [];
}
```

## Reactivity with Signals

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
import { Component, Input } from "@angular/core";
import { NgIf } from "@angular/common";
import validate from "@primate/angular/validate";
import type Validated from "@primate/angular/Validated";

@Component({
  imports: [NgIf],
  template: `
    <h2>Counter</h2>
    <button (click)="decrement()" [disabled]="loading">-</button>
    <span>{{ value }}</span>
    <button (click)="increment()" [disabled]="loading">+</button>

    <p *ngIf="error" style="color:red">{{ error?.message }}</p>
  `,
})
export default class Counter {
  @Input() id = "";
  @Input("counter") initial = 0;

  counter!: Validated<number>;

  get value() { return this.counter.value(); }
  get loading() { return this.counter.loading(); }
  get error() { return this.counter.error(); }

  ngOnInit() {
    this.counter = validate<number>(this.initial)
      .post(`/counter?id=${this.id}`);
  }

  increment() { this.counter.update(n => n + 1); }
  decrement() { this.counter.update(n => n - 1); }
}
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import Counter from "#store/Counter";
import route from "primate/route";
import response from "primate/response";
import pema from "pema";
import number from "pema/number";
import string from "pema/string";

await Counter.schema.create();

// GET page
route.get(async () => {
  const [existing] = await Counter.find({});
  const counter = existing ?? await Counter.insert({ value: 10 });

  return response.view("Counter.component.ts", {
    id: counter.id,
    counter: counter.value
  });
});

// POST updates (called by validate().post)
route.post(async request => {
  // Ensure id is present
  const id = string.parse(request.query.get("id"));
  // Validate and coerce
  const body = request.body.fields(pema({ value: number }).coerce);
  // Persist changes
  await Counter.update({ id }, { value: body.value });
  return null; // 204
});
```

The wrapper automatically tracks loading states, captures validation errors, and
posts updates on `update()` calls.

## Forms

Install the Angular Forms package:

```bash
npm install @angular/forms
```

Create the form component:

```ts
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email">
      <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
        Email is required and must be valid
      </div>

      <input formControlName="password" type="password" placeholder="Password">
      <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
        Password must be at least 8 characters
      </div>

      <button type="submit" [disabled]="!form.valid">Submit</button>
    </form>
  `,
})
export default class LoginForm {
  fb = inject(FormBuilder);
  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit() {
    if (!this.form.valid) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.form.value),
    });
  }
}
```

Add the corresponding route:

```ts
// routes/login.ts
import route from "primate/route";
import pema from "pema";
import string from "pema/string";
import response from "primate/response";

const LoginSchema = pema({
  email: string.email(),
  password: string.min(8),
});

route.get(() => response.view("LoginForm.component.ts"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // implement authentication logic

  return null; // 204 or redirect/response
});
```

## Layouts

For SSR with hydration, layouts accept a `slot: TemplateRef` and render it
using `*ngTemplateOutlet`.

Create a layout component:

```ts
// components/Layout.component.ts
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
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Layout.component.ts"));
```

This layout applies to all pages under this route subtree, rendering them
inside the layout's slot.

### Passing Props to Layouts

Pass props from `+layout.ts` to the layout component as standard inputs:

```ts
// components/Layout.component.ts
import { Component, Input, TemplateRef } from "@angular/core";

@Component({
  template: `
    <header>
      <h1>{{ brand }}</h1>
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
  @Input() brand = "My App";
}
```

Then update the layout registration to pass the props:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Layout.component.ts", {
  brand: "Primate Angular Demo"
}));
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
    this.meta.addTag({
      name: "description",
      content: "Learn more about us"
    });
    this.meta.addTag({
      property: "og:title",
      content: this.pageTitle
    });
  }
}
```

## Configuration

| Option         | Type       | Default             | Description                |
| -------------- | ---------- | ------------------- | -------------------------- |
| fileExtensions | `string[]` | `[".component.ts"]` | Associated file extensions |

### Example

```ts
import config from "primate/config";
import angular from "@primate/angular";

export default config({
  modules: [
    angular({
      // add `.ng.ts` to associated file extensions
      fileExtensions: [".component.ts", ".ng.ts"],
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
