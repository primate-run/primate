declare global {
  interface Window { colorscheme: any; }
}

const cookieName = "color-scheme";

function getCookieValue(name: string) {
  const namePrefix = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const c of cookies) {
    if (c.indexOf(namePrefix) === 0) return decodeURIComponent(c.substring(namePrefix.length));
  }
  return null;
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}; path=/`;
};

function getColorScheme() {
  return getCookieValue(cookieName)
    || (window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
}

function setColorScheme(name: string) {
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", name);
  setCookie(cookieName, name);
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
  name: getColorScheme(),
  getColorScheme,
  setColorScheme,
};

setColorScheme(window.colorscheme.name);

export { };
