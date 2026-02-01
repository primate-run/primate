---
title: Project structure
---

# Project structure

Primate is convention over configuration. This page lists common directories
and files used in a Primate app.

## Directories

| Directory                     | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `build`                       | build artefacts — add to `.gitignore`                |
| [config](/docs/configuration) | configuration files                                  |
| [locales](/docs/i18n#locales) | I18N locales                                         |
| `node_modules`                | install artefacts — add to `.gitignore`              |
| `pages`                       | app and error HTML template pages                    |
| [routes](/docs/routing)       | filesystem-based routes                              |
| `static`                      | static assets — image, font, global JS and CSS files |
| [stores](/docs/stores)        | data stores                                          |
| [views](/docs/views)          | frontend views                                       |

## Files

| File                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `package.json`      | dependency management                                |
| `.gitignore`        | add `build`, `node_modules` and any other transients |
| `tsconfig.json`     | extend `primate/tsconfig`                            |
| `package-lock.json` | lock file if using npm                               |
| `pnpm-lock.yaml`    | lock file if using pnpm                              |
| `bun.lockb`         | lock file if using Bun                               |
| `yarn.lock`         | lock file if using Yarn                              |

## Config files

Reside inside `config`. May be authored in Javascript or TypeScript.

| File                                              | Purpose                   |
| ------------------------------------------------- | ------------------------- |
| [app.ts](/docs/configuration#app-ts)              | app options               |
| [session.ts](/docs/configuration#session-ts)      | session shape and options |
| [i18n.ts](/docs/configuration#i18n-ts)            | i18n options              |
| [database/\*.ts](/docs/configuration#database-ts) | database options          |

## Route files

Files inside the `routes` directory registered to a [backend](/docs/backend)
based on their extension. You may use different backends in your app for
different routes, but every route must be uniquely handled by one backend.

| File                                   | Purpose                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `index.ts`                             | matches `/`                                                                    |
| `user.ts`                              | matches `/user`                                                                |
| [user/\[name\].ts]                     | matches `/user/*` — `*` is anything _except_ a `/`                             |
| [user/\[\[name\]\].ts]                 | matches `/user` _and_ `/user/*` — `*` is anything _except_ a `/`               |
| [user/\[...name\].ts]                  | matches `/user/*` — `*` is anything _including_ zero or more `/`               |
| [user/\[\[...name\]\].ts]              | matches `/user` _and_ `/user/*` — `*` is anything _including_ zero or more `/` |
| [+layout.ts](/docs/routes#layouts)     | route layouts for routes in same directory and below                           |
| [+guard.ts](/docs/routing#guards)      | route guard for routes in same directory and below                             |
| [+error.ts](/docs/routing#error-files) | route error file for routes in same directory                                  |

[user/\[name\].ts]: /docs/routing#dynamic-routes
[user/\[\[name\]\].ts]: /docs/routing#optional-routes
[user/\[...name\].ts]: /docs/routing#rest-routes
[user/\[\[...name\]\].ts]: /docs/routing#optional-rest-routes

## View files

Files inside the `views` directory registered to a
[frontend](/docs/frontend) based on their full extensions. You may use
different frontends in your app for different views, but every view
must be uniquely handled by one frontend.

| File             | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `*.jsx`          | [React], [Solid] or [Voby] views                |
| `*.tsx`          | typed [React], [Solid] or [Voby] views          |
| `*.svelte`       | [Svelte](/docs/frontend/svelte) views           |
| `*.vue`          | [Vue](/docs/frontend/vue) views                 |
| `*.component.ts` | [Angular](/docs/frontend/angular) views         |
| `*.marko`        | [Marko](/docs/frontend/marko) views             |
| `*.eta`          | [Eta](/docs/frontend/eta) views                 |
| `*.html`         | [HTML](/docs/frontend/html) views               |
| `*.htmx`         | [HTMX](/docs/frontend/htmx) views               |
| `*.hbs`          | [Handlebars](/docs/frontend/handlebars) views   |
| `*.webc`         | [Web components](/docs/frontend/web-components) |

[React]: /docs/frontend/react
[Solid]: /docs/frontend/solid
[Voby]: /docs/frontend/voby

## Store files

Files inside the `stores` directory, representing [data stores](/docs/stores).
May be authored in JavaScript or TypeScript.

| File      | Purpose                                                    |
| --------- | ---------------------------------------------------------- |
| `User.ts` | ORM for `user` table (import with `#store/User` in routes) |
| `Post.ts` | ORM for `post` table (import with `#store/Post` in routes) |

## Locale files

Files inside the `locales` directory, for [I18N](/docs/i18n).

| File       | Purpose                             |
| ---------- | ----------------------------------- |
| `en-US.ts` | locale for English (United States)  |
| `en-UK.ts` | locale for English (United Kingdom) |
| `de-DE.ts` | locale for German (Germany)         |
