# What is Primate?

Primate is the universal framework for building full-stack web applications.

Unlike other frameworks, it doesn't lock you into one particular stack,
and instead allows you to freely combine frontends, backends, runtimes and
databases into a mix that works best for you.

It's the *last* web framework you'll ever need.

## Quickstart

The easiest way to get started with Primate is run it. Create a project
directory, say `app`, enter it, and run

[s=quickstart]

This will start up an app running from the project directory that will serve any
*route* files you have under `routes`. Let's create one at `routes/index.ts`.

```ts
import route from "primate/route";

route.get(() => "Hello, world!");
```

!!!
If you're a JavaScript user, create `routes/index.js` instead. All TypeScript
examples apply equally to JavaScript sans types.
!!!

Your app will now greet you with a simple message at http://localhost:6161.

## Add config

To further customize your app, create a config file at `config/app.ts`.

```ts
import config from "primate/config";

export default config({
  // config comes here
});
```

## Switch backend
If you want to use another backend other than the built-in
TypeScript / JavaScript, first install its package.

[s=switch-backend-shell]

!!!
All `@primate/*` packages are officially supported by the Primate team and
tested against every new version.
!!!

Then add it to your config at `config/app.ts`.

[s=switch-backend-config]

Finally, create a route in your backend of choice.

[s=switch-backend-route]

## Add frontend

To add a frontend framework to your app, install the corresponding Primate
package and the frontend itself.

[s=add-frontend-shell]

!!!
Primate supports [many more](/frontend/intro) frontends -- but for brevity, the
quickstart only lists the major ones.
!!!

Like before, add the frontend to your config file.

[s=add-frontend-config]

Create a `components` directory and in it a frontend component.

[s=add-frontend-component]


