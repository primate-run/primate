# Frontends

Primate isn't tied to any specific frontend framework. The core platform comes
along with a [`view`][view] handler that serves files from the `components`
directory. Additionally there are officially supported modules that cover many
frontend frameworks. When loaded, they extend the `view` handler to support
more file extensions.

Those frameworks come with different capabilities, like server-side rendering
(SSR), hydration and SPA support. In some cases, some capabilities have simply
not been implemented yet in the module. In other cases, the frontend framework
itself doesn't support those.

## Layouts

Svelte, React and Solid currently support [recursive layouting][Layouts]
in Primate.

## Server-side rendering (SSR)

This refers to the frontend framework compiling its files on the server and
sending prerendered HTML pages to the client. It avoids having the client
itself do the first rendering, which would otherwise cause a delay in the time
taken for a first contentful paint by the browser.

All official frontend modules aside from HTMX support SSR. HTMX itself has no
support for SSR.

## Hydration

Once a complete prerendered page has been sent to client, it is often necessary
to kick off the frontend framework on the client so it can register events and
manage the page. This is known as hydration.

Currently the Angular, Svelte, React and Solid modules support hydration,
while work on Vue hydration is planned for future versions.

HTMX, having no SSR support, also has no support for hydration. The HTMX client
is *always* sent along the page and activates on page load.

## SPA

For modules that support it (currently Svelte, React and Solid), SPA
browsing is active by default. It injects a small JavaScript client into the
build which uses `fetch` to manage clicking on links and submitting forms
instead of reloading the entire page, and also manages browsing the history.

## Head component

If you need to manipulate the `<head>` part from within an individual
component, use `<svelte:head>` for Svelte. For React and Solid, you
can use the `@primate/react/head` or `@primate/solid/head` export for the same
behavior.

## Support matrix

Every frontend framework registers its own file extension with the
[`view`][view] handler and needs to be loaded in `primate.config.js`. You can
use different frontend frameworks alongside each other, in different routes.

|Framework       |Extension      |Props|Layouts|SSR|Hydration|SPA|Head|I18N|
|----------------|---------------|-----|-------|---|---------|---|----|----|
|[Angular]       |`.component.ts`|✓    |✗      |✓  |✓        |✗  |✗   |✗   |
|[Eta]           |`.eta`         |✓    |✗      |✓  |✗        |✗  |✗   |✗   |
|[Handlebars]    |`.hbs`         |✓    |✗      |✓  |✓        |✗  |✗   |✗   |
|[HTML]          |`.html`        |✗    |✗      |✓  |✗        |✗  |✗   |✗   |
|[HTMX]          |`.htmx`        |✓    |✗      |✓  |✗        |✗  |✗   |✗   |
|[Markdown]      |`.md`          |✗    |✗      |✓  |✗        |✗  |✗   |✗   |
|[Marko]         |`.marko`       |✓    |✗      |✓  |✗        |✗  |✗   |✗   |
|[React]         |`.jsx`         |✓    |✓      |✓  |✓        |✓  |✓   |✓   |
|[Solid]         |`.jsx`         |✓    |✓      |✓  |✓        |✓  |✓   |✓   |
|[Svelte]        |`.svelte`      |✓    |✓      |✓  |✓        |✓  |✓   |✓   |
|[Voby]          |`.voby`        |✓    |✗      |✓  |✗        |✗  |✗   |✗   |
|[Vue]           |`.vue`         |✓    |✗      |✓  |✗        |✗  |✗   |✗   |
|[Web Components]|`.webc`        |✓    |✗      |✗  |✗        |✗  |✗   |✗   |

## Error list

### Missing Dependencies

Level [`Error`][error] | [`Bailout`][bailout]

A frontend module was loaded in the configuration for which dependencies are
missing.

*Install the dependency according to the instructions in the error message.*

The frontend module only provides wrappers for frontend frameworks. The actual
package needs to be installed by the user. Primate will inform you which
dependency is missing and what command you need to issue to install it.

[view]: /guide/responses#view
[Layouts]: /guide/layouts
[I18N]: /modules/i18n
[bailout]: /guide/logging#bailout
[error]: /guide/logging#error
[Angular]: /modules/angular
[Eta]: /modules/eta
[Handlebars]: /modules/handlebars
[HTML]: /modules/html
[HTMX]: /modules/htmx
[Markdown]: /modules/markdown
[Marko]: /modules/marko
[React]: /modules/react
[Solid]: /modules/solid
[Svelte]: /modules/svelte
[Voby]: /modules/voby
[Vue]: /modules/vue
[Web Components]: /modules/web-components
