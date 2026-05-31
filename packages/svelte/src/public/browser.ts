export default function svelte() {
  return {
    name: "svelte",
    setup() { },
  };
}

export { default as app } from "#client/app";
export { default as client } from "#client/index";

