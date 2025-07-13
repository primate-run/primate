import BuildModule from "#BuildModule";

export default (extension?: string, options?: typeof BuildModule.options) =>
  new BuildModule(extension, options);
