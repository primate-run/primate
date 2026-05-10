const getCookieValue = (name: string) => {
  const namePrefix = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const c of cookies) {
    if (c.indexOf(namePrefix) === 0) return decodeURIComponent(c.substring(namePrefix.length));
  }
  return null;
};

const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}${expires}; path=/`;
};

const cookieName = "color-scheme";

const preference = () =>
  window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";

export const getColorScheme = () => getCookieValue(cookieName) || preference();

const colorScheme = getColorScheme();

export const setColorScheme = async (value: string) => {
  setCookie(cookieName, value, 9);
  if (value === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

setColorScheme(colorScheme);
