import string from "@rcompat/string";

export default function wrap(code: string, path: string, build_id: string) {
  const router = `ROUTER_${build_id}`;

  const prelude = string.dedent`
    import ${router} from "primate/router";
    ${router}.push("${path}");
  `;
  const postlude = `\n${router}.pop();\n`;

  return `${prelude}${code}${postlude}`;
};

