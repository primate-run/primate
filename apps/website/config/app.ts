import html from "@primate/html";
import markdown from "@primate/markdown";
import svelte from "@primate/svelte";
import config from "primate/config";
import markdown_options from "./markdown.options.ts";
import website from "./Website.ts";

export default config({
  http: {
    host: "0.0.0.0",
  },
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
    svelte(),
    website(),
    markdown(markdown_options),
  ],
});
