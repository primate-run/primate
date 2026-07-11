import eslint from "apekit/lint";

const route_pages = [
  "apps/*/routes/*.tsx",
  "apps/*/routes/*/*.tsx",
  "apps/*/routes/*/*/*.tsx",
  "apps/*/routes/*/*/*/*.tsx",
];

export default [
  ...eslint(import.meta.dirname),
  {
    files: ["apps/*/routes/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: route_pages,
        },
      },
    },
  },
];
