import server from "@primate/core/server";
import error from "@rcompat/error";
import type { FileRef } from "@rcompat/fs";

const GEM = "primate-run";
const t = error.template;

function only_route_files() {
  return t`ruby: only route files are supported`;
}
function no_routes_detected(file: FileRef) {
  return t`no routes detected in ${file}`;
}
function pkg_mismatch(major: number, minor: number) {
  const range = `~> ${server.TAG}.x`;
  const version = `${major}.${minor}.x`;
  return t`installed ${GEM} gem version ${version} not in range ${range}`;
}
function gem_not_found() {
  const command = `gem install ${GEM} -v "~> ${server.TAG}.0"`;
  return t`missing ${GEM}, run ${command}`;
}
function pkg_not_found() {
  const add = `bundle add ${GEM} -v "~> ${server.TAG}.0`;
  const install = "bundle install";
  return t`gem not found in bundle - run ${add} and ${install}`;
}

const errors = error.coded({
  only_route_files,
  no_routes_detected,
  gem_not_found,
  pkg_mismatch,
  pkg_not_found,
});

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
