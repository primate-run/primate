import Logger from "@primate/core/logger";

const json = {
  errors: {
    DoubleFileExtension: {
      message: "double file extension {0}",
      fix: "unload one of the two handlers registering the file extension",
      level: "Error",
    },
    DoubleModule: {
      message: "double module {0} in {1}",
      fix: "load {0} only once",
      level: "Error",
    },
    DoublePathParameter: {
      message: "double path parameter {0} in route {1}",
      fix: "disambiguate path parameters in route names",
      level: "Error",
    },
    DoubleRoute: {
      message: "double route of the form {0}",
      fix: "disambiguate routes",
      level: "Error",
    },
    EmptyConfigFile: {
      message: "empty config file at {0}",
      fix: "add configuration options to the file or remove it",
      level: "Warn",
    },
    EmptyPathParameter: {
      message: "empty path parameter {0} in route {1}",
      fix: "name the parameter or remove it",
      level: "Error",
    },
    EmptyRouteFile: {
      message: "empty route file at {0}",
      fix: "add routes to the file or remove it",
      level: "Warn",
    },
    EmptyDirectory: {
      message: "empty {0} directory",
      fix: "populate {1} or remove it",
      level: "Warn",
    },
    ErrorInConfigFile: {
      message: "error in config file: {0}",
      fix: "check errors in config file by running {1}",
      level: "Error",
    },
    BadBody: {
      message: "bad body returned from route, got {0}",
      fix: "return a proper body from route",
      level: "Error",
    },
    BadDefaultExport: {
      message: "bad default export at {0}",
      fix: "use only functions for the default export",
      level: "Error",
    },
    BadPath: {
      message: "bad path {0}",
      fix: "use only letters, digits, '_', '[', ']' or '=' in path filenames",
      level: "Error",
    },
    BadTypeExport: {
      message: "bad type export at {0}",
      fix: "export object with a `base` string and a `validate` function",
      level: "Error",
    },
    BadTypeName: {
      message: "bad type name {0}",
      fix: "use lowercase-first latin letters and decimals in type names",
      level: "Error",
    },
    MismatchedBody: {
      message: "{0}: {1}",
      fix: "make sure the body payload corresponds to the used content type",
      level: "Error",
    },
    MismatchedPath: {
      message: "mismatched path {0}: {1}",
      fix: "fix the type or the caller",
      level: "Info",
    },
    MismatchedType: {
      message: "mismatched type: {0}",
      fix: "fix the type or the caller",
      level: "Info",
    },
    ModuleNoHooks: {
      message: "module {0} has no hooks",
      fix: "ensure every module uses at least one hook or deactivate it",
      level: "Warn",
    },
    ModuleNoName: {
      message: "module at index {0} has no name",
      fix: "update module at index {0} and inform maintainer",
      level: "Error",
    },
    ModulesArray: {
      message: "the {0} config property must be an array",
      fix: "change {0} to an array in the config or remove this property",
      level: "Error",
    },
    NoHandler: {
      message: "no handler for {0}",
      fix: "add handler module for this component or remove {0}",
      level: "Error",
    },
    NoRouteToPath: {
      message: "no {0} route to {1}",
      fix: "create a {0} route function at {2}.js",
      level: "Info",
    },
    OptionalRoute: {
      message: "optional route {0} must be a leaf",
      fix: "move route to leaf (last) position in filesystem hierarchy",
      level: "Error",
    },
    ReservedTypeName: {
      message: "reserved type name {0}",
      fix: "do not use any reserved type names",
      level: "Error",
    },
    RestRoute: {
      message: "rest route {0} must be a leaf",
      fix: "move route to leaf (last) position in filesystem hierarchy",
      level: "Error",
    },
  },
};

const errors = Logger.err(json.errors, "primate");

const {
  DoubleFileExtension,
  EmptyConfigFile,
  ErrorInConfigFile,
  MismatchedType,
  NoHandler,
  BadBody,
  MismatchedBody,
  MismatchedPath,
  NoRouteToPath,
  DoubleRoute,
  OptionalRoute,
  RestRoute,
  EmptyDirectory,
  ModulesArray,
  ModuleNoName,
  ModuleNoHooks,
  DoubleModule,
  BadTypeExport,
  BadTypeName,
  ReservedTypeName,
} = errors;

export {
  DoubleFileExtension,
  DoubleModule,
  EmptyConfigFile,
  ErrorInConfigFile,
  MismatchedType,
  NoHandler,
  BadBody,
  MismatchedBody,
  MismatchedPath,
  NoRouteToPath,
  DoubleRoute,
  OptionalRoute,
  RestRoute,
  EmptyDirectory,
  ModulesArray,
  ModuleNoName,
  ModuleNoHooks,
  BadTypeExport,
  BadTypeName,
  ReservedTypeName,
};

export default errors;
