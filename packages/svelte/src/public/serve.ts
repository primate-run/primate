import ServeModule from "#ServeModule";

export default (extension?: string, options?: typeof ServeModule.options) =>
  new ServeModule(extension, options);
