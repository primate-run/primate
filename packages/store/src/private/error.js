import module from "#name";
import log from "@primate/core/log";
import FileRef from "@rcompat/fs/FileRef";

const base = level => (url, args) => (...params) => log[level]({
  params,
  name: new FileRef(url).base,
  module,
  ...args,
});

const warn = base("warn");
const error = base("error");

export { error, warn };
