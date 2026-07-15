const frontends = [
  { name: "react", extension: ".react.tsx" },
  { name: "svelte", extension: ".svelte" },
  { name: "vue", extension: ".vue" },
  { name: "solid", extension: ".solid.tsx" },
  { name: "marko", extension: ".marko" },
  { name: "angular", extension: ".component.ts" },
] as const;

export const frontendLinks = () => frontends;

export default frontends;
