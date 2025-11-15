import { writable } from "svelte/store";

const item = "colorScheme";

const preference = () =>
  window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";

const colorscheme = writable(localStorage.getItem(item) || preference());

colorscheme.subscribe(async value => {
  localStorage.setItem(item, value);
  if (value === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  await fetch("/", {
    headers: {
      "Color-Scheme": value === "dark" ? "dark" : "light",
    },
  });
});

export default colorscheme;
