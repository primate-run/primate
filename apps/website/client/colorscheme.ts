declare global {
  interface Window { colorscheme: any }
}

const cookie_name = "color-scheme";
const {
  encodeURIComponent: encode,
  decodeURIComponent: decode,
} = globalThis;

function get_cookie_value(name: string) {
  const prefix = `${encode(name)}=`;
  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const c of cookies) {
    if (c.indexOf(prefix) === 0) return decode(c.slice(prefix.length));
  }
};

function set_cookie(name: string, value?: string) {
  document.cookie = `${encode(name)}=${encode(value ?? "")}; path=/`;
};

function match_media() {
  return window.matchMedia("(prefers-color-scheme:dark)").matches
    ? "dark"
    : "light";
}

function get_color_scheme() {
  return get_cookie_value(cookie_name) ?? match_media();
}

function set_color_scheme(name: string) {
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", name);
  set_cookie(cookie_name, name);
  const classList = document.documentElement.classList;
  if (name === "dark") {
    classList.remove("light");
    classList.add("dark");
  } else {
    classList.remove("dark");
    classList.add("light");
  }
};

window.colorscheme = {
  name: get_color_scheme(),
  get: get_color_scheme,
  set: set_color_scheme,
};

set_color_scheme(window.colorscheme.name);

export { };
