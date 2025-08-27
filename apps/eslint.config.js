import base from "../eslint.config.js";

export default [
  ...base,
  {
    files: ["snippets/**"],
    rules: {
      "@perfectionist/sort-interfaces": "off",
      "@perfectionist/sort-objects": "off",
      "@perfectionist/sort-union-types": "off",
    },
  },
];
