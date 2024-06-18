<img src="https://raw.githubusercontent.com/primatejs/primate/master/assets/logo.svg" alt="Primate" width="60"/>

# Primate

Polymorphic development platform. To start [read guide].

![npm](https://img.shields.io/npm/v/primate)
![npm](https://img.shields.io/npm/dt/primate)
![GitHub](https://img.shields.io/github/license/primatejs/primate)
![GitHub issues](https://img.shields.io/github/issues/primatejs/primate)
![GitHub stars](https://img.shields.io/github/stars/primatejs/primate)
![Node.js Version](https://img.shields.io/node/v/primate)
![GitHub last commit](https://img.shields.io/github/last-commit/primatejs/primate)

## Why use Primate?

### Framework Independence

Primate stands apart as a framework-agnostic tool, allowing you to seamlessly
integrate and start coding within any major framework, eliminating the
constraints of being tied to specific options like Nuxt, Next, or others.

### Frameworks We Support

- Svelte
- React
- Solid
- Vue
- Angular
- Web Components
- HTMX
- Handlebars
- Marko

### Databases We Support

- SQLite
- MongoDB
- Postgresql
- MySQL
- SurrealDB

### Languages We Support

- JavaScript
- TypeScript
- Golang
- Python
- Ruby

## Packages

| Package                                     | Description                   |
|---------------------------------------------|-------------------------------|
|[primate](packages/primate)                  | Primate framework             |
|[create-primate](packages/create-primate)    | GUI for creating Primate apps |
|[@primate/frontend](packages/frontend)       | Frontend frameworks           |
|[@primate/store](packages/store)             | Data store                    |
|[@primate/types](packages/types)             | Runtime types                 |
|[@primate/session](packages/session)         | User sessions                 |
|[@primate/i18n](packages/i18n)               | Internationalization          |
|[@primate/binding](packages/binding)         | Other backend languages       |
|[website](packages/website)                  | Primate website               |

## Comparison with other frameworks

|Feature           |Next  |Nuxt  |SvelteKit|Primate                                                 |
|------------------|------|------|---------|--------------------------------------------------------|
|Backend           |JS, TS|JS, TS|JS, TS   |JS, TS, Go, Python, Ruby                                |
|Frontend          |React |Vue   |Svelte   |React, Vue, Svelte, Solid, Angular, HTMX, Handlebars, WC|
|Native runtime    |Node  |Node  |Node     |Node, Deno, Bun                                         |
|I18N              |✓     |✓     |✗        |@primate/i18n                                           |
|Head Component    |✓     |✓     |✗        |React, Svelte, Solid                                    |
|Route guards      |✗     |✗     |✗        |✓                                                       |
|Recursive layouts |✓     |✓     |✓        |✓                                                       |
|Data stores/ORM   |✗     |✗     |✗        |SQLite, PostgreSQL, MongoDB, SurrealDb                  |
|WebSockets        |✗     |✗     |✗        |✓                                                       |
|Server-sent events|✗     |✗     |✗        |✓                                                       |
|User sessions     |✗     |✓     |✗        |@primate/session                                        |

## Resources

* Website: https://primatejs.com
* IRC: Join the `#primate` channel on `irc.libera.chat`
* Reddit: [r/primatejs](https://reddit.com/r/primatejs)
* Twitter (X): [@primatejs](https://x.com/primatejs)
* Blog: https://primatejs.com/blog
* StackOverflow: https://stackoverflow.com/questions/tagged/primate

## Example Applications

- [hynt.us](https://github.com/profullstack/hynt-web) - a link shortener app using SurrealDB and Svelte
- [starter app](https://github.com/primatejs/app) - demos most of the features of Primate
- [FastestEngineer](https://fastest.engineer) - A fully-featured SaaS boilerplate

## License

MIT

## Contributing

By contributing to Primate, you agree that your contributions will be licensed
under its MIT license.

Clone https://github.com/primatejs/app alongside your Primate directory and
switch to the `dev` branch. This branch uses symbolic links to Primate and its
modules. In the case of some modules (`@primate/frontend`, `@primate/i18n`,
`@primate/binding`), symbolic links lead to errors and the modules need to be
copied in verbatim. Use the `refresh-deps.sh` script to do so.

[read guide]: https://primatejs.com/guide/getting-started
