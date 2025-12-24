import Runtime from "#Runtime";
import string from "@rcompat/string";

export default class Default extends Runtime {
  compile = {
    server: (text: string) => string.dedent`
      import render from "@primate/html/render";

      export default props => render(${JSON.stringify(text)}, props);`,
  };
}
