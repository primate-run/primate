# Runtime support

Primate aims for 100% interoperability between runtimes and build targets.
However, due to runtime implementation limitations, some features may currently
not be available in certain configurations. In the following is a list of
support for Primate across runtime and build targets.

## Build targets

|Target                 |Node|Deno|Bun|
|-----------------------|----|----|---|
|Web                    |✓   |✓   |✓  |
|Desktop (linux-x64)    |✗   |✗   |✓  |
|Desktop (darwin-x64)   |✗   |✗   |✗  |
|Desktop (darwin-arm64) |✗   |✗   |✗  |
|Desktop (windows-x64)  |✗   |✗   |✓  |

## Frontends

|Frontend        |Node|Deno|Bun (web)|Bun (desktop)|
|----------------|----|----|---------|-------------|
|[Angular]       |✓   |✗   |✓        |✓            |
|[Eta]           |✓   |✓   |✓        |✓            |
|[Handlebars]    |✓   |✓   |✓        |✓            |
|[HTML]          |✓   |✓   |✓        |✓            |
|[HTMX]          |✓   |✓   |✓        |✓            |
|[Markdown]      |✓   |✓   |✓        |✓            |
|[Marko]         |✓   |✓   |✓        |✓            |
|[React]         |✓   |✓   |✓        |✓            |
|[Solid]         |✓   |✓   |✓        |✓            |
|[Svelte]        |✓   |✓   |✓        |✓            |
|[Voby]          |✓   |✗   |✓        |✓            |
|[Vue]           |✓   |✓   |✓        |✓            |
|[Web Components]|✓   |✓   |✓        |✓            |

## Backends

|Backend         |Node|Deno|Bun (web)|Bun (desktop)|
|----------------|----|----|---------|-------------|
|[Go]            |✓   |✓   |✗        |✗            |
|[Python]        |✓   |✓   |✗        |✗            |
|[Ruby]          |✓   |✗   |✗        |✗            |
|[TypeScript]    |✓   |✓   |✓        |✓            |

## Stores

|Frontend        |Node|Deno|Bun (web)|Bun (desktop)|
|----------------|----|----|---------|-------------|
|[MongoDB]       |✓   |✓   |✓        |✗†           |
|[MySQL]         |✓   |✓   |✓        |✗†           |
|[PostgreSQL]    |✓   |✓   |✓        |✗†           |
|[SQLite]        |✓   |✗   |✓        |✓            |
|[SurrealDB]     |✓   |✓   |✓        |✗†           |

† A server is required

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
[Go]: /modules/go
[Python]: /modules/python
[Ruby]: /modules/ruby
[TypeScript]: /modules/typescript
[MongoDB]: /modules/drivers#mongodb
[MySQL]: /modules/drivers#mysql
[PostgreSQL]: /modules/drivers#postgresql
[SQLite]: /modules/drivers#sqlite
[SurrealDB]: /modules/drivers#surrealdb
