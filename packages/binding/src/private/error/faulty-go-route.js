import log from "@primate/core/log";
import file from "@rcompat/fs/file";

export default (...params) => log.error({
  params,
  name: file(import.meta.url).base,
  module: "@primate/binding",
  message: "the Go route {0} contains the following error\n {1}",
});
