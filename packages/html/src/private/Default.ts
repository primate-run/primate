import Runtime from "#Runtime";
import dedent from "@rcompat/string/dedent";

export default class Default extends Runtime {
  compile = {
    server: (text: string) => dedent`
      import render from "@primate/html/render";

      export default props => render(${JSON.stringify(text)}, props);`,
  };
}
