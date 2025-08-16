# Project structure

Primate is convention over configuration. This page lists common directories
and files used in a Primate app.

## Directories

|Directory|Purpose|
|-|-|
|`build`|build artefacts — add to `.gitignore`|
|[components](/components)|frontend components|
|[config](/configuration)|configuration files|
|[locales](/i18n#locales)|I18N locales|
|`node_modules`|install artefacts — add to `.gitignore`|
|[pages](/pages)|app and error HTML template pages|
|[routes](/routes)|filesystem-based routes|
|[static](/static)|static assets — image, font, global JS and CSS files|
|[stores](/stores)|data stores|

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
|[app.ts](/configuration#app-ts)|app options|
|[session.ts](/configuration#session-ts)|session shape and options|
|[database.ts](/configuration#database-ts)|database options|

## Route files

Files inside the `routes` directory registered to a [backend](/backend) based
on their extension. You may use different backends in your app for different
routes, but every route must be uniquely handled by one backend.

| | |
|-|-|
|`index.ts`|matches `/`|
|`user.ts`|matches `/user`|
|[user/\[name\].ts](/routing#dynamic-routes)|matches `/user/*` — `*` is anything *except* a `/`|
|[user/\[\[name\]\].ts](/routing#optional-routes)|matches `/path` *and* `/user/*` — `*` is anything *except* a `/`|
|[user/\[...name\].ts](/routing#rest-routes)|matches `/user/*` — `*` is anything *including* a `/`|
|[user/\[\[...name\]\].ts](/routing#optional-rest-routes)|matches `/user` *and* `/user/*` — `*` is anything *including* a `/`|
|[+guard.ts](/routes#guards)|route guard for routes in same directory and below|
|[+error.ts](/routes#error-files)|route error file for routes in same directory|
|[+layout.ts](/routes#layouts)|route layouts for routes in same directory and below|

## Component files

Files inside the `components` directory registered to a [frontend](/frontend)
based on their full extensions. You may use different frontends in your app for
different components, but every component must be uniquely handled by one
frontend.

| | |
|-|-|
|`*.jsx`|[React](/frontend/react), [Solid](/frontend/solid) or [Voby](/frontend/voby) components|
|`*.tsx`|typed [React](/frontend/react), [Solid](/frontend/solid) or [Voby](/frontend/voby) components|
|`*.svelte`|[Svelte](/frontend/svelte) components|
|`*.vue`|[Vue](/frontend/vue) components|
|`*.component.ts`|[Angular](/frontend/angular) components|
|`*.marko`|[Marko](/frontend/marko) components|
|`*.eta`|[Eta](/frontend/eta) components|
|`*.html`|[HTML](/frontend/html) components|
|`*.htmx`|[HTMX](/frontend/htmx) components|
|`*.hbs`|[Handlebars](/frontend/handlebars) components|
|`*.webc`|[Web components](/frontend/web-components)|

## Store files

Files inside the `stores` directory, representing [data stores](/stores). May
be authored in JavaScript or TypeScript.

| | |
|-|-|
|`User.ts` -- example|import using `#store/User` in routes|
|`auth/User.ts` -- example|import using `#store/auth/User` in routes|

## Locale files

Files inside the `locales` directory, for [I18N](/i18n). Currently only JSON
locales are supported.

| | |
|-|-|
|`en-US.json` -- default|locale for English (United States)|
|`en-UK.json` -- example|locale for English (United Kingdom)|
|`de-DE.json` -- example|locale for German (Germany)|
