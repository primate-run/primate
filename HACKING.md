## Licensing

In contributing to Primate, you agree that your contributions will be licensed
under its MIT license.

## Intro

Primate is the universal web framework. To that end, it supports a multitude 
of frontends, backends, runtimes and databases.

Primate is batteries included and all packages under the `@primate` namespace 
are officially supported.

## Setup

We recommend joining our Discord server at https://discord.gg/RSg4NNwM4f to
coordinate development.

Install pnpm as we use a monorepo for development with the `workspace` protocol
which isn't supported by npm.

## Development cycle

To build the project, run `pnpm run build` in the root directory to build the
packages. To test the packages and the example apps under `app`, run
`pnpm run test`.

You can also run the same command for individual packages in their respective
directories.

To test apps individual, run `npx primate test` in their respective directories.

## Coding style

* One class / object / type for file, unless the supporting code is only used
once.

## Package layout

Packages maintain a separation of private and public code.

Private code should be scoped to the package only and imported within the
package with a hash (`#`) import defined in `package.json`'s `imports` field.
In particular, packages should not use relative imports as these break easily.

Public code represents the API surface and should contain individual files 
reexporting private code and no meaningful code. Typically:

`export { default } from "#IMPORT_NAME";`
