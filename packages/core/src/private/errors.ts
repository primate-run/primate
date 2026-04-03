import error from "@rcompat/error";
import type { FileRef } from "@rcompat/fs";

const t = error.template;

function app_reserved_directory(directory: string) {
  return t`cannot build to ${directory}, reserved directory`;
}
function app_duplicate_module(name: string) {
  return t`module ${name} loaded twice`;
}

const APP = error.coded({
  app_reserved_directory,
  app_duplicate_module,
});

function build_missing_binary_addon() {
  return t`could not find matching binary addon`;
}
function build_missing_route(route: string, file: FileRef) {
  return t`cannot find route source for ${route} under ${file.path}`;
}
function build_multiple_db_drivers(drivers: string[]) {
  const defaults = ["index.ts", "index.js", "default.ts", "default.js"];
  return t`multiple database drivers ${drivers}, add one of ${defaults}`;
}
function build_live_reload_failed(filename: string, cause: Error) {
  return t`failed to live-reload ${filename}: ${cause}`;
}
function build_previous_build_exists(file: FileRef) {
  return t`${file.path} exists but does not contain a previous build`;
}

const BUILD = error.coded({
  build_missing_binary_addon,
  build_missing_route,
  build_multiple_db_drivers,
  build_live_reload_failed,
  build_previous_build_exists,
});

function config_tsconfig_has_paths() {
  return t`tsconfig.json exists with paths, remove config paths`;
}
function config_file_missing() {
  return t`missing ${"config/app.ts"}`;
}
function config_file_empty(file: FileRef) {
  return t`${file.path}: empty config file`;
}
function config_file_error(file: FileRef, cause: Error) {
  return t`error in config file ${file.path}: ${cause}`;
}
function config_missing(property: string) {
  return t`${property} not configured`;
}

const CONFIG = error.coded({
  config_file_missing,
  config_missing,
  config_tsconfig_has_paths,
  config_file_empty,
  config_file_error,
});

function frontend_missing(view: string, module?: string) {
  if (module === undefined) return t`no frontend for ${view}`;
  const pkg_name = `@primate/${module}`;
  return t`no frontend for ${view}, did you configure ${pkg_name}?`;
}
function frontend_missing_app_js() {
  return t`could not find ${"app.js"} in assets`;
}

const FRONTEND = error.coded({
  frontend_missing,
  frontend_missing_app_js,
});

function request_unsupported_mime(path: string, mime: string) {
  return t`${path}: unsupported MIME type ${mime}`;
}
function request_unparsable_mime(path: string, mime: string, cause: Error) {
  return t`${path}: unparsable MIME type ${mime} (${cause})`;
}
function request_unexpected_body(expected: string, actual: string) {
  return t`request body: expected ${expected}, got ${actual}`;
}
function request_bag_missing_key(bag: string, key: string) {
  return t`${bag} has no key ${key}`;
}

const REQUEST = error.coded({
  request_unsupported_mime,
  request_unparsable_mime,
  request_unexpected_body,
  request_bag_missing_key,
});

function response_invalid_body(body: string) {
  return t`invalid body ${body} returned from route`;
}

const RESPONSE = error.coded({
  response_invalid_body,
});

function hook_route_functions_not_allowed(file: string) {
  return t`${file}: route functions may not be used inside +hook files`;
}
function hook_not_allowed(file: string) {
  return t`${file}: hook functions may only be used inside +hook files`;
}
function hook_unused(file: string) {
  return t`${file}: did not register any hooks (call hook(...))`;
}
function hook_reused_next() {
  return t`hook called next() more than once`;
}
const advice = "return next(request);";
function hook_no_return() {
  return t`hook called next() without returning; did you forget ${advice}?`;
}
function hook_bad_return() {
  return t`hook must return a response-like value or ${advice}`;
}

const HOOK = error.coded({
  hook_route_functions_not_allowed,
  hook_not_allowed,
  hook_unused,
  hook_reused_next,
  hook_no_return,
  hook_bad_return,
});

function session_missing_id() {
  return t`session store must have a session_id field`;
}
function session_id_string() {
  return t`session store session_id must be a string type`;
}
function session_id_data() {
  return t`"both ${"id"} and ${"data"} must be defined or undefined`;
}

const SESSION = error.coded({
  session_missing_id,
  session_id_string,
  session_id_data,
});

function target_missing(target: string, targets: string[]) {
  return t`no target ${target}, available targets ${targets}`;
}
function target_duplicate(target: string) {
  return t`cannot add target ${target} twice`;
}

const TARGET = error.coded({
  target_missing,
  target_duplicate,
});

function route_missing_verb(route: string, verb: string) {
  return t`${route} has no verb ${verb}`;
}
function route_invalid_special_file(route: string) {
  return t`${route} is not a valid special file`;
}
function route_invalid_parameter(route: string, parameter: string) {
  return t`${route} has an invalid parameter ${parameter}`;
}
function route_invalid_characters(route: string, regexp: RegExp) {
  return t`${route} may only contain any of ${regexp.source.slice(1, -1)}`;
}

const ROUTE = error.coded({
  route_missing_verb,
  route_invalid_special_file,
  route_invalid_parameter,
  route_invalid_characters,
});

function view_missing(view: string) {
  return t`no view ${view}`;
}
function view_missing_default_export(view: string) {
  return t`${view} must export a default component`;
}
function view_duplicate_extension(extension: string) {
  return t`duplicate file extension ${extension}`;
}
function view_error(view: string, cause: Error) {
  return t`${view} error: ${cause}`;
}

const VIEW = error.coded({
  view_missing,
  view_missing_default_export,
  view_duplicate_extension,
  view_error,
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
};

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
