import html from "@primate/html";
import markdown from "@primate/markdown";
import marko from "@primate/marko";
import config from "primate/config";
import markdown_options from "./markdown.options.ts";
import website from "./Website.ts";

export default config({
  loaders: {
    ".woff2": "file",
  },
  entrypoints: {
    colorscheme: "colorscheme.ts",
    css: "master.css",
  },
  livereload: {
    host: "localhost",
  },
  modules: [
    html(),
    marko(),
    website,
    markdown(markdown_options),
  ],
});
