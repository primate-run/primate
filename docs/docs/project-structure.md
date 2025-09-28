# Project structure

Primate is convention over configuration. This page lists common directories
and files used in a Primate app.

## Directories

|Directory|Purpose|
|-|-|
|`build`|build artefacts — add to `.gitignore`|
|[components](/docs/components)|frontend components|
|[config](/docs/configuration)|configuration files|
|[locales](/docs/i18n#locales)|I18N locales|
|`node_modules`|install artefacts — add to `.gitignore`|
|pages|app and error HTML template pages|
|[routes](/docs/routing)|filesystem-based routes|
|static|static assets — image, font, global JS and CSS files|
|[stores](/docs/stores)|data stores|

## Files

| | |
|-|-|
|`package.json`|dependency management|
|`.gitignore`|add `build`, `node_modules` and any other transients|
|`tsconfig.json`|extend `primate/tsconfig`|
|`package-lock.json`|lock file if using npm|
|`pnpm-lock.yaml`|lock file if using pnpm|
|`bun.lockb`|lock file if using Bun|
|`yarn.lock`|lock file if using Yarn|

## Config files

Reside inside `config`. May be authored in Javascript or TypeScript.

| | |
|-|-|
|[app.ts](/docs/configuration#app-ts)|app options|
|[session.ts](/docs/configuration#session-ts)|session shape and options|
|[i18n.ts](/docs/configuration#i18n-ts)|i18n options|
|[database/*.ts](/docs/configuration#database-ts)|database options|

## Route files

Files inside the `routes` directory registered to a [backend](/docs/backend)
based on their extension. You may use different backends in your app for
different routes, but every route must be uniquely handled by one backend.

| | |
|-|-|
|`index.ts`|matches `/`|
|`user.ts`|matches `/user`|
|[user/\[name\].ts]|matches `/user/*` — `*` is anything *except* a `/`|
|[user/\[\[name\]\].ts]|matches `/user` *and* `/user/*` — `*` is anything *except* a `/`|
|[user/\[...name\].ts]|matches `/user/*` — `*` is anything *including* a `/`|
|[user/\[\[...name\]\].ts]|matches `/user/*` — `*` is anything *including* a `/`|
|[+layout.ts](/docs/routes#layouts)|route layouts for routes in same directory and below|
|[+guard.ts](/docs/routing#guards)|route guard for routes in same directory and below|
|[+error.ts](/docs/routing#error-files)|route error file for routes in same directory|

[user/\[name\].ts]: /docs/routing#dynamic-routes
[user/\[\[name\]\].ts]: /docs/routing#optional-routes
[user/\[...name\].ts]: /docs/routing#rest-routes
[user/\[\[...name\]\].ts]: /docs/routing#optional-rest-routes

## Component files

Files inside the `components` directory registered to a
[frontend](/docs/frontend) based on their full extensions. You may use
different frontends in your app for different components, but every component
must be uniquely handled by one frontend.

| | |
|-|-|
|`*.jsx`|[React], [Solid] or [Voby] components|
|`*.tsx`|typed [React], [Solid] or [Voby] components|
|`*.svelte`|[Svelte](/docs/frontend/svelte) components|
|`*.vue`|[Vue](/docs/frontend/vue) components|
|`*.component.ts`|[Angular](/docs/frontend/angular) components|
|`*.marko`|[Marko](/docs/frontend/marko) components|
|`*.eta`|[Eta](/docs/frontend/eta) components|
|`*.html`|[HTML](/docs/frontend/html) components|
|`*.htmx`|[HTMX](/docs/frontend/htmx) components|
|`*.hbs`|[Handlebars](/docs/frontend/handlebars) components|
|`*.webc`|[Web components](/docs/frontend/web-components)|

[React]: /docs/frontend/react
[Solid]: /docs/frontend/solid
[Voby]: /docs/frontend/voby

## Store files

Files inside the `stores` directory, representing [data stores](/docs/stores).
May be authored in JavaScript or TypeScript.

| | |
|-|-|
|`User.ts` — import using `#store/User` in routes|
|`auth/User.ts` — import using `#store/auth/User` in routes|

## Locale files

Files inside the `locales` directory, for [I18N](/docs/i18n).

| | |
|-|-|
|`en-US.ts` — locale for English (United States)|
|`en-UK.ts` — locale for English (United Kingdom)|
|`de-DE.ts` — locale for German (Germany)|
