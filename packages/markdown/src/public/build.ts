import BuildModule from "#BuildModule";
import type { MarkedExtension } from "marked";

export default (extension?: string, options?: MarkedExtension) =>
  new BuildModule(extension, options);
