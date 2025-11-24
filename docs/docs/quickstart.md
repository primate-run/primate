---
title: Quickstart
---

# Quickstart

The easiest way to get started with Primate is to run it.

[s=quickstart/shell]

This boots an app from the current directory and serves any _route_ files
under `routes`. Let's create one:

[s=quickstart/route]

Your app now greets you at http://localhost:6161.

!!!
Requests to `/` are handled by an `index` file. Primate uses
[filesystem-based routing](/docs/routing).
!!!

## Create config

To customize your app, create a `config` directory and a config file:

[s=quickstart/config]

## Add frontend

Install the Primate package for your frontend, plus the frontend itself:

[s=quickstart/add-frontend]

!!!
All `@primate/*` packages are officially supported and versioned with Primate.
!!!

Add the frontend to your config:

[s=add-frontend/config]

Then create a `views` directory and a view — here is a simple counter:

[s=add-frontend/views]

!!!
Primate supports [many frontends](/docs/frontend); the quickstart only shows a
few.
!!!

Serve the view from a route with the `view` handler:

[s=add-frontend/route]

## Switch backend

By default, routes run in TypeScript/JavaScript. To add another backend,
install its package:

[s=switch-backend/shell]

!!!
For some backends (e.g. Go), you'll need a compiler to produce Wasm. See the
backend docs for setup details.
!!!

Then add it to your config:

[s=switch-backend/config]

And create a route:

[s=switch-backend/route]

!!!
Backends and frontends are fully interchangeable — combine them freely.
!!!

## Add database

To persist data across reloads, install a database package plus `pema` for
validation:

[s=persist-data/shell]

Configure your database:

[s=persist-data/config]

!!!
Except for SQLite, you need a running database server.
!!!

Create a store for your counter:

[s=persist-data/store]

!!!
Validation is applied before writes — databases handle structure and types,
Primate adds higher-level rules.
!!!

Update your component to sync with the backend:

[s=persist-data/component]

And wire it together with a route:

[s=persist-data/route]

!!!
Use pema's `coerce` to turn web inputs into typed values before validation.
!!!

## Wrap up

With just a few files, you now have an app that can:

- Map requests to routes
- Render views with multiple frontends
- Run code in different backends
- Persist data in a database
- Validate inputs end-to-end

## Next steps

At this point, you've built a minimal but complete app. From here, you can
scaffold a project, explore real examples, or dive deeper into the docs — and
start building production-ready apps.

- **Scaffold with init** — Run `npx primate init` for a guided setup.
- **Explore examples** — Browse example apps in the docs and repo.
- **Dive deeper** — Check out guides and API docs.
