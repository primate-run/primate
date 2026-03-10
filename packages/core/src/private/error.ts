import fail from "#fail";
import type { FileRef } from "@rcompat/fs";
import type { Dict } from "@rcompat/type";

function coded<T extends Dict<(...args: any[]) => Error>>(fns: T): T {
  return Object.fromEntries(
    Object.entries(fns).map(([key, fn]) => [
      key,
      (...args: any[]) => {
        const err = fn(...args);
        (err as any).code = key;
        return err;
      },
    ]),
  ) as T;
}

function app_reserved_directory(directory: string) {
  return fail`cannot build to ${directory}, reserved directory`;
}
function app_duplicate_module(name: string) {
  return fail`module ${name} loaded twice`;
}

const APP = coded({
  app_reserved_directory,
  app_duplicate_module,
});

function build_missing_binary_addon() {
  return fail`could not find matching binary addon`;
}
function build_missing_route(route: string, file: FileRef) {
  return fail`cannot find route source for ${route} under ${file.path}`;
}
function build_multiple_db_drivers(drivers: string[]) {
  const defaults = ["index.ts", "index.js", "default.ts", "default.js"];
  return fail`multiple database drivers ${drivers}, add one of ${defaults}`;
}
function build_live_reload_failed(filename: string, error: Error) {
  return fail`failed to live-reload ${filename}: ${error}`;
}
function build_previous_build_exists(file: FileRef) {
  return fail`${file.path} exists but does not contain a previous build`;
}

const BUILD = coded({
  build_missing_binary_addon,
  build_missing_route,
  build_multiple_db_drivers,
  build_live_reload_failed,
  build_previous_build_exists,
});

function config_tsconfig_has_paths() {
  return fail`tsconfig.json exists with paths, remove config paths`;
}
function config_file_empty(file: FileRef) {
  return fail`${file.path}: empty config file`;
}
function config_file_error(file: FileRef, error: Error) {
  return fail`error in config file ${file.path}: ${error}`;
}

const CONFIG = coded({
  config_tsconfig_has_paths,
  config_file_empty,
  config_file_error,
});

function frontend_missing(view: string, module?: string) {
  if (module === undefined) return fail`no frontend for ${view}`;
  const pkg_name = `@primate/${module}`;
  return fail`no frontend for ${view}, did you configure ${pkg_name}?`;
}
function frontend_missing_app_js() {
  return fail`could not find ${"app.js"} in assets`;
}

const FRONTEND = coded({
  frontend_missing,
  frontend_missing_app_js,
});

function request_unsupported_mime(path: string, mime: string) {
  return fail`${path}: unsupported MIME type ${mime}`;
}
function request_unparsable_mime(path: string, mime: string, cause: Error) {
  return fail`${path}: unparsable MIME type ${mime} (${cause})`;
}
function request_unexpected_body(expected: string, actual: string) {
  return fail`request body: expected ${expected}, got ${actual}`;
}
function request_bag_missing_key(bag: string, key: string) {
  return fail`${bag} has no key ${key}`;
}

const REQUEST = coded({
  request_unsupported_mime,
  request_unparsable_mime,
  request_unexpected_body,
  request_bag_missing_key,
});

function response_invalid_body(body: string) {
  return fail`invalid body ${body} returned from route`;
}

const RESPONSE = coded({
  response_invalid_body,
});

function hook_route_functions_not_allowed(file: string) {
  return fail`${file}: route functions may not be used inside +hook files`;
}
function hook_not_allowed(file: string) {
  return fail`${file}: hook functions may only be used inside +hook files`;
}
function hook_unused(file: string) {
  return fail`${file}: did not register any hooks (call hook(...))`;
}
function hook_reused_next() {
  return fail`hook called next() more than once`;
}
const advice = "return next(request);";
function hook_no_return() {
  return fail`hook called next() without returning; did you forget ${advice}?`;
}
function hook_bad_return() {
  return fail`hook must return a response-like value or ${advice}`;
}

const HOOK = coded({
  hook_route_functions_not_allowed,
  hook_not_allowed,
  hook_unused,
  hook_reused_next,
  hook_no_return,
  hook_bad_return,
});

function session_missing_id() {
  return fail`session store must have a session_id field`;
}
function session_id_string() {
  return fail`session store session_id must be a string type`;
}

const SESSION = coded({
  session_missing_id,
  session_id_string,
});

function target_missing(target: string, targets: string[]) {
  return fail`no target ${target}, available targets ${targets}`;
}
function target_duplicate(target: string) {
  return fail`cannot add target ${target} twice`;
}

const TARGET = coded({
  target_missing,
  target_duplicate,
});

function route_missing_verb(route: string, verb: string) {
  return fail`${route} has no verb ${verb}`;
}
function route_invalid_special_file(route: string) {
  return fail`${route} is not a valid special file`;
}
function route_invalid_parameter(route: string, parameter: string) {
  return fail`${route} has an invalid parameter ${parameter}`;
}
function route_invalid_characters(route: string, regexp: RegExp) {
  return fail`${route} may only contain any of ${regexp.source.slice(1, -1)}`;
}

const ROUTE = coded({
  route_missing_verb,
  route_invalid_special_file,
  route_invalid_parameter,
  route_invalid_characters,
});

function view_missing(view: string) {
  return fail`no view ${view}`;
}
function view_missing_default_export(view: string) {
  return fail`${view} must export a default component`;
}
function view_duplicate_extension(extension: string) {
  return fail`duplicate file extension ${extension}`;
}
function view_error(view: string, error: Error) {
  return fail`${view} error: ${error}`;
}

const VIEW = coded({
  view_missing,
  view_missing_default_export,
  view_duplicate_extension,
  view_error,
});

function i18n_unit_not_supported(unit: string) {
  return fail`unit ${unit} not supported`;
}

const I18N = coded({
  i18n_unit_not_supported,
});

const errors = {
  ...APP,
  ...BUILD,
  ...CONFIG,
  ...FRONTEND,
  ...ROUTE,
  ...REQUEST,
  ...RESPONSE,
  ...HOOK,
  ...SESSION,
  ...TARGET,
  ...VIEW,
  ...I18N,
};

export type Code = keyof typeof errors;

export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
