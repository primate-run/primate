import server from "@primate/core/server";
import error from "@rcompat/error";

const PACKAGE = "primate-run";
const t = error.template;

function only_route_files() {
  return t`python: only route files are supported`;
}
function package_not_found() {
  const command = `pip install ${PACKAGE}~=${server.TAG}.0`;
  return t`package not found, run ${command}`;
}
function package_mismatch(major: number, minor: number) {
  const range = `~> ${server.TAG}.x`;
  const version = `${major}.${minor}.x`;
  return t`${PACKAGE} package version ${version} not in range ${range}`;
}

const errors = error.coded({
  only_route_files,
  package_not_found,
  package_mismatch,
});

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
