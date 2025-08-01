import AppError from "@primate/core/AppError";
import runtime from "@rcompat/runtime";

const commands = {
  bun: "bun build",
  deno: "deno compile",
} as const;

function which(target: string) {
  if (target in commands) {
    return commands[target as keyof typeof commands];
  }
  throw new AppError("unsupported runtime {0}", target);
};

type Init = {
  exe: string;
  files: string[];
  flags: string;
};

export default function(init: Init) {
  return `
    ${which(runtime)} \
    ${init.files.map(file => `build/${file}`).join(" ")} \
    --conditions=runtime --compile --minify \
    ${init.flags} \
    --outfile build/${init.exe}
  `;
}
