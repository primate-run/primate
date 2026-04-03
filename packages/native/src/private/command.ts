import error from "@rcompat/error";
import runtime from "@rcompat/runtime";

const commands = {
  bun: "bun build",
  deno: "deno compile",
} as const;

function unsupported_runtime(target: string) {
  return error.template`unsupported runtime ${target}`;
}

const errors = error.coded({
  unsupported_runtime,
});

function which(target: string) {
  if (target in commands) return commands[target as keyof typeof commands];

  throw errors.unsupported_runtime(target);
};

type Init = {
  exe: string;
  files: string[];
  flags: string;
};

export default function(init: Init) {
  return `
    ${which(runtime.name)} \
    ${init.files.map(file => `build/${file}`).join(" ")} \
    --conditions=runtime --compile --minify \
    ${init.flags} \
    --outfile build/${init.exe}
  `;
}
