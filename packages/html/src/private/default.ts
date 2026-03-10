import init from "#init";
import frontend from "@primate/core/frontend";
import string from "@rcompat/string";

export default frontend({
  ...init,
  compile: {
    server: (text: string) => string.dedent`
      import render from "@primate/html/render";

      export default props => render(${JSON.stringify(text)}, props);`,
  },
});
