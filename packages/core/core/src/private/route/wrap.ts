import location from "#location";
import type FileRef from "@rcompat/fs/FileRef";
import dedent from "@rcompat/string/dedent";

export default function wrap(code: string, file: FileRef, build: {
  id: string;
  stage: FileRef;
}) {
  const router = `ROUTER_${build.id}`;
  const debased = file.debase(build.stage.join(location.routes)).path
    .slice(1, -file.extension.length);

  const prelude = dedent`
    import ${router} from "primate/router";
    ${router}.push("${debased}");
  `;
  const postlude = `
${router}.pop();
`;

  return `${prelude}${code}${postlude}`;
};

