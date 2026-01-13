---
title: Release 0.25: Native Deno support, I18N for Svelte/React/Solid
epoch: 1698532413000
author: terrablue
---
Today we're announcing the availability of the Primate 0.25 preview release.
This release introduces native Deno support, meaning Primate now supports all
the three significant runtimes in JS space (Node, Deno, Bun).

In addition, this release introduces `@primate/i18n`, an internationalization
module with a unified API for our Svelte, React and Solid [frontend modules].

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Native Deno support

In our [last release], we introduced native support for Bun, allowing you to
run Primate with `bun --bun x primate`, benefitting from significant speed
gains introduced by Bun.

This release brings the number of runtimes we support up to three, adding native
Deno support. Native means here that, like with Bun, Primate will try to use
native Deno routines (like `Deno.serve`) wherever possible and otherwise fall
back to NPM.

To run your Primate app with Deno, use `deno run --allow-all npm:primate`.

## I18N module for Svelte, React and Solid

This release introduces a new module, `@primate/i18n`, for handling
internationalization across the different frontend frameworks we support. At
this stage, this module supports Svelte, React and Solid using a nearly
completely unified API.

To add support for multiple languages in your application, first install this
module by issuing `npm install @primate/i18n`. Then, import and initialize it
in your Primate configuration file.

```js caption=primate.config.js
import i18n from "@primate/i18n";

export default {
  modules: [
    i18n(),
  ],
};
```

To add languages, create a locales directory `locales`. In this directory,
create a JSON file for every locale you would like to support and add keys and
translations.

```json caption=locales/en-US.js
{
  "welcome": "Hi and welcome, {username}",
  "message": "This is my website, feel at home here.",
  "bye": "Bye",
  "switch-language": "Switch language",
  "english": "English",
  "german": "German"
}
```

Add another locale.

```json caption=locales/de-DE.js
{
  "welcome": "Hallo und willkommen, {username}",
  "message": "Das ist meine Website. Mache dich hier gemütlich.",
  "bye": "Tschüss",
  "switch-language": "Sprache wechseln",
  "english": "Englisch",
  "german": "Deutsch"
}
```

Next, import `@primate/svelte/i18n`, if you're a Svelte user.

### Svelte

```js caption=components/Home.svelte
<script>
  import t from "@primate/svelte/18n";

  export let username;
</script>
<h1>{$t("welcome", { username })}</h1>

<p>{$t("message")}</p>

{$t("bye")}~
```

In the case of Svelte, since the default export exposes a store, you need to
subscribe to it by prefixing it with `$` wherever you use it.

To switch between locales, import `@primate/svelte/locale` and call
`locale.set` with the new locale.

```js caption=components/Home.svelte
<script>
  import t from "@primate/svelte/i18n";
  import locale from "@primate/svelte/locale";

  export let username;
</script>
<h1>{$t("welcome", { username })}</h1>

<p>{$t("message")}</p>

{$t("bye")}~

<h3>{$t("switch-language")}</h3>
<div><a on:click={() => locale.set("en-US")}>{$t("English")}</a></div>
<div><a on:click={() => locale.set("de-DE")}>{$t("German")}</a></div>
```

### React and Solid

You can use an almost identical API for React and Solid to achieve the same.

```jsx caption=components/Home.jsx
import t from "@primate/react/i18n";
// import t from "@primate/solid/i18n"; // for solid

export default function ({ username }) {
  return <>
    <h1>{t("welcome", { username })}</h1>

    <p>{t("message")}</p>

    {t("bye")}~
  </>;
}
```

In this case, since the default export exposes a function that returns a state
variable, you just use it as is (without prefixing it with `$` as with Svelte).

Again, to switch between locales, call `locale.set` with the new locale.

```jsx
import t from "@primate/react/i18n";
import locale from "@primate/react/locale";
// for Solid
// import t from "@primate/solid/i18n";
// import locale from "@primate/solid/locale";

export default function ({ username }) {
  return <>
    <h1>{t("welcome", { username })}</h1>

    <p>{t("message")}</p>

    {t("bye")}~

    <h3>{t("switch-language")}</h3>
    <div><a onClick={() => locale.set("en-US")}>{t("English")}</a></div>
    <div><a onClick={() => locale.set("de-DE")}>{t("German")}</a></div>
  </>;
}
```

This release marks only the introduction of the I18N module. In the future we
plan to extend it with access to different translation backends and other
features commonly expected in a modern I18N library.

## Executing guards just before the route handler

The only breaking feature of this release is a change to the order of execution
for guards. Previously guards were executed *after* a route was matched but
before all route hook functions and the route handler itself were executed.
One of the most important route hook is the one used by `@primate/store` to
start a transaction before the route runs and make all
transactionalized data stores available to the route as `request.store`.

This meant that if you needed to access `request.store` in a guard (for
example, to check if a given API key is matched in the database), it would not
be available.

This release changes the order of execution such that guards are executed after
all route hooks have finished running and right before the route handler
itself is executed. Guards thus have access to exactly the same `request`
object that the route handler would see, including stores.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Introduce IDE TypeScript support
* Add support for TypeScript (.ts) routes
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Add hydration and liveview support for `@primate/vue`
* Support the `multipart/form-data` content type
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants
* Add support for additional backends in I18N

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.26, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[frontend modules]: /modules/frontend
[irc]: https://web.libera.chat#primate
[last release]: https://primate.run/blog/release-024
[changelog]: https://github.com/primate-run/primate/releases/tag/0.25.0
