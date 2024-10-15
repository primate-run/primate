# Logging

Primate has three log levels, `error`, `warn` and `info`. As a general rule,
'error' means a severe disruption to the application (and leads to bailout
during startup), 'warn' indicates degraded functionality in an otherwise
nominal system, and 'info' serves to give more information. In terms of
actionability, 'error' logs **must** be addressed, 'warn' logs **should** be
checked, and 'info' logs **may** be ignored.

## Configuring

By default, the error level is to set to `warn`, which logs all errors and
warnings. You can change this in your configuration.

```js primate.config.js
export default {
  log: {
    // show all logs
    level: "info",
  },
};
```

When Primate shows errors or warnings, it will include a short reason and a
quickfix, as well as link to the website for a longer explanation and fix.

```text
?? @primate/store empty store directory
++ populate /home/user/app/stores with stores
   -> https://primatejs.com/modules/store#empty-store-directory
```

## Error

Marked by two red exclamation marks, `!!`.

An error means a severe disruption to the application and must be addressed.
Errors which occur during runtime indicate a severe mismatch between two parts
of an application (for example, trying to use the `view` handler with a file
extension that hasn't been registered by an module).

Errors occuring during startup are bailouts.

### Bailout

Errors occuring during startup result in a bailout and must be addressed before
a restart is possible.

Bailouts are almost always the result of a misconfiguration that would
introduce ambiguity into how Primate operates.

## Warn

Marked by two yellow question marks, `??`.

A warning means degraded functionality in an otherwise functional application,
and should be checked. Warnings usually indicate having configured a certain
feature (like loading a module) but not using it.

## Info

Marked by two green minuses, `--`.

Info logs serve to provide more insight into the internal workings of Primate
and can be usually ignored.

### Possibly intentional

Some info logs are indicated as possibly intentional. This is due to Primate
not knowing if this is due to a client misconfiguration (for example, using
a client that sends alphanumeric strings where numeric strings are expected) or
due to actual client manipulation.

## Fix

Marked by two blue pluses, `++`.

In the cases of known `Warn` and `Error` logs, Primate will suggest a quickfix
which may help addressing the problem, in addition to supplying a link to the
error on the website.
