import error from "@rcompat/error";
import type { FileRef } from "@rcompat/fs";

const t = error.template;

function backend_error(route: FileRef, cause: Error) {
  return t`error in module ${route.path}\n${cause}`;
}
function only_route_files() {
  return t`go: only route files are supported`;
}
function invalid_version_format(format: string) {
  return t`invalid version format: ${format}`;
}
function version_not_in_range(version: string, tag: string) {
  return t`installed version ${version} not in range ${tag}`;
}
function dependency_not_found(dependency: string, command: string) {
  return t`${dependency} dependency not found - run ${command}`;
}

const errors = error.coded({
  backend_error,
  only_route_files,
  invalid_version_format,
  version_not_in_range,
  dependency_not_found,
});

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
