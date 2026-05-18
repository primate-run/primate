import { createHighlighter } from "shiki";

const highlighter = await createHighlighter({
  langs: [
    "javascript",
    "typescript",
    "go",
    "python",
    "ruby",
    "rust",
    "jsx",
    "svelte",
    "vue",
    "angular-ts",
    "html",
    "handlebars",
    "markdown",
    "marko",
    "shell",
    "json",
    "http",
    "css",
  ],
  themes: [
    "plastic",
    "vesper",
    "nord",
    "min-dark",
    "min-light",
    "catppuccin-frappe",
  ],
});

export default highlighter;
