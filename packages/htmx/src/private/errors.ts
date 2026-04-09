import error from "@rcompat/error";
import fs from "@rcompat/fs";

const pkg_json = await (await fs.project.package(import.meta.dirname)).json() as any;
const peer_deps = pkg_json.peerDependencies;

const t = error.template;

function version(pkg: string) {
  return `${pkg}@${peer_deps[pkg]}`;
}

function could_not_find_app_js_in_assets() {
  return t`could not find app.js in assets`;
}

function client_side_templates_required() {
  const option = "clientSideTemplates";
  const pkg = "htmx-ext-client-side-templates";
  return t`${option} requires ${version(pkg)} to be installed`;
};

function htmx_package_required() {
  return t`${version("htmx.org")} must be installed`;
};

function template_engine_required(engine: string, pkg: string) {
  const option = "clientSideTemplates.engine";
  return t`${option} is set to ${engine}, but ${version(pkg)} is not installed`;
}

const errors = error.coded({
  could_not_find_app_js_in_assets,
  template_engine_required,
  client_side_templates_required,
  htmx_package_required,
});

export default errors;
