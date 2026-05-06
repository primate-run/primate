import { writable } from "svelte/store";

const item = "colorScheme";

const preference = () =>
  window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";

const original = localStorage.getItem(item) || preference();
const colorscheme = writable(original);

colorscheme.subscribe(async value => {
  localStorage.setItem(item, value);
  if (value === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  if (original !== value) {
    await fetch("/", {
      headers: {
        "Color-Scheme": value === "dark" ? "dark" : "light",
      },
    });
  }
});

export default colorscheme;
