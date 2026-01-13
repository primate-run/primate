---
title: Primate 0.33: Everything is typed, Grain backend and new website
epoch: 1759064876000
author: terrablue
---

Today we're announcing the availability of the Primate 0.33 preview release.
This release features a full rewrite of Primate in and for TypeScript, Grain
backend support, and a new website.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get a
quick idea.
!!!

## Full TypeScript rewrite

Primate 0.33 marks a significant milestone: we've rewritten the framework in
TypeScript from the ground up.

### Typed routes

Routes now have full type inference for path parameters, query strings, and
request bodies:

```ts
// routes/user/[id].ts
import route from "primate/route";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const Query = pema({
  include: string.optional(),
});

route.get(request => {
  // TypeScript knows `id` is a string from the path parameter
  const id = request.path.get("id");

  // query parameters are fully typed
  const { include } = request.query.parse(Query);

  // return type is inferred and type-checked
  return {
    user: { id, name: "John" },
    included: include ? ["profile", "settings"] : []
  };
});
```

### Typed sessions

Session data is now fully typed throughout your application:

```ts
// config/session.ts
import session from "primate/config/session";
import pema from "pema";
import string from "pema/string";
import date from "pema/date";

const SessionData = pema({
  userId: string,
  lastActivity: date,
});

export default session({
  schema: SessionData,
  cookie: { name: "app_session" }
});
```

Now in your routes, session access is type-safe:

```ts
import session from "#session";
import route from "primate/route";

route.get(() => {
  if (!session.exists) {
    session.create({
      userId: "user123",
      lastActivity: new Date()
    });
  }

  const data = session.get();
  // TypeScript knows: data.userId is string
  return `Welcome back, user ${data.userId}`;
});
```

### Typed internationalization

I18N is now fully typed with key autocompletion and parameter validation.

Add a locale.

```ts
// locales/en-US.ts
import locale from "primate/i18n/locale";

export default locale({
  welcome: "Welcome to {appName}!",
  user_greeting: "Hello, {name}! You have {count:n|{count} message|{count} messages}",
  settings: "Settings",
  logout: "Log out"
});
```

Configure i18n.

```ts
// config/i18n.ts
import i18n from "primate/config/i18n";
import en from "#locale/en-US";

export default i18n({
  defaultLocale: "en-US",
  currency: "USD",
  locales: {
    "en-US": en,
  }
});
```

In your components, you get full type checking:

```tsx
// components/Welcome.tsx
import t from "#i18n";

export default function Welcome({ name, messageCount }: {
  name: string;
  messageCount: number;
}) {
  return (
    <div>
      <h1>{t("welcome", { appName: "Primate" })}</h1>
      <p>{t("user_greeting", { name, count: messageCount })}</p>
      <button onClick={() => t.locale.set("de-DE")}>
        {t("settings")}
      </button>
    </div>
  );
}
```

### Typed database stores

Database operations are now fully typed with schema inference:

```ts
// stores/User.ts
import store from "primate/store";
import primary from "pema/primary";
import string from "pema/string";
import uint from "pema/uint";
import date from "pema/date";

export default store({
  id: primary,
  name: string.max(100),
  email: string.email(),
  age: uint.range(13, 120),
  created: date.default(() => new Date()),
}).extend(User => ({
  const U = User.Schema;

  findByEmail(email: typeof U.email) {
    return User.find({ email });
  },

  updateProfile(id: typeof U.id, updates: {
    name?: typeof U.name;
    email?: typeof U.email;
  }) {
    return User.update({ id }, updates);
  }
}));
```

Using the store in routes provides type safety:

```ts
// routes/users.ts
import User from "#store/User";
import route from "primate/route";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const CreateUser = pema({
  name: string.max(100),
  email: string.email(),
  age: uint.range(13, 120),
});

route.get(async () => {
  const users = await User.find({});
  // TypeScript knows the exact shape of each user
  return users.map(user => ({
    id: user.id,
    name: user.name,
    isAdult: user.age >= 18
  }));
});

route.post(async request => {
  const userData = request.body.form(CreateUser);
  const user = await User.insert(userData);

  // all properties are typed and validated
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      created: user.created.toISOString()
    }
  };
});
```

## Grain backend support

This version introduces support for the [Grain programming language] as a
backend. Grain is a "strongly-typed functional programming language for the
modern web".

### Setup and configuration

!!!
Make sure you install Grain and that the `grain` executeable is in your `PATH`.
!!!

Install the Primate Grain package.

```bash
npm install @primate/grain
```

Load it in your config.

```ts
// config/app.ts
import config from "primate/config";
import grain from "@primate/grain";

export default config({
  modules: [grain()],
});
```

### Writing routes in Grain

Grain routes follow similar patterns to other Primate backends.

```gr
// routes/hello.gr
module Hello

from "primate/request" include Request
from "primate/response" include Response
from "json" include Json

use Request.{ type Request }
use Response.{ type Response }

provide let get = (request: Request) =>
  JsonObject([("message", JsonString("Hello from Grain!"))])

provide let post = (request: Request) => {
  let body = Request.Body.json(request)
  Response.json(JsonObject([
    ("received", body),
    ("processed", JsonBoolean(true))
  ]))
}
```

Grain integration was added by [jtenner](https://github.com/jtenner). Thank
you!

## New website

We've redesigned our website and documentation to reflect Primate's evolution
into a fully-typed, universal web framework.

## What's next

Check out our issue tracker for upcoming [0.34 features].

## Fin

If you like Primate, consider [joining our Discord server][discord].

Otherwise, have a blast with everything being typed!

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[Grain programming language]: https://grain-lang.org/
[0.34 features]: https://github.com/primate-run/primate/milestone/6
