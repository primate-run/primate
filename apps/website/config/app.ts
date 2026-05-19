import html from "@primate/html";
import markdown from "@primate/markdown";
import svelte from "@primate/svelte";
import config from "primate/config";
import loader from "primate/loader";
import markdownOptions from "./markdown.options.ts";
import website from "./Website.ts";

export default config({
  http: {
    host: "0.0.0.0",
  },
  modules: [
    loader("woff2", "file"),
    html(),
    svelte(),
    website(),
    markdown(markdownOptions),
  ],
});
