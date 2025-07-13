import ServeModule from "@primate/core/frontend/ServeModule";

export default class ServeMarkdown extends ServeModule {
  name = "markdown";
  root = false;
  defaultExtension = ".md";
}
