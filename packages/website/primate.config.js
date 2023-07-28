import priss from "priss";
//import blog from "@priss/blog";
//import {master} from "@priss/themes";
const master = i => i;
const blog = () => undefined;

export default {
  http: {
    host: "0.0.0.0",
  },
  modules: [priss({
    title: "Primate",
    description: "Expressive, minimal and extensible web framework",
    root: "content",
    theme: master({
      navbar: [
        {label: "Guide", link: "/guide/getting-started"},
        {label: "Modules", link: "/modules/official"},
        /*{label: "Blog", link: "/blog"},*/
      ],
      sidebar: {
        guide: [
          {heading: "Introduction"},
          "Getting started",
          "Project structure",
          "Configuration",
          "Use cases",
          {heading: "Concepts"},
          "Routes",
          "Responses",
          "Types",
          "Guards",
          "Components",
          {heading: "Modules"},
          "Extending Primate",
          "Hooks",
          {heading: "Extras"},
          "Logging",
          "Security",
        ],
        reference: [
          {heading: "Errors"},
          {
            errors: [
              "primate",
              "primate/guard",
              "primate/store",
              "primate/ws",
            ],
          },
        ],
        modules: [
          {heading: "Modules"},
          "Official",
          "Third-party",
          {heading: "Frontend"},
          "Frameworks",
          "Svelte",
          "React",
          "Vue",
          "HTMX",
          {heading: "Data"},
          "Types",
          "Store",
          "Drivers",
          {heading: "Others"},
          "Session",
          "Guard",
          "WebSocket",
          "esbuild",
        ],
      },
      github: "primatejs/primate",
      twitter: "primatejs",
      chat: "https://web.libera.chat/gamja#primate",
    }),
    uses: [blog()],
  })],
};
