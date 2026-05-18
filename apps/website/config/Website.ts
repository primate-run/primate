import type { Module } from "primate";

const cookie_name = "color-scheme";

const website: () => Module = () => {
  return {
    name: "primate-website",

    setup({ onHandle }) {
      onHandle((request, next) => {
        const { cookies } = request;

        const scheme = cookies.try(cookie_name) ?? "light";

        const placeholders = {
          "color-scheme": scheme,
          "theme-color": scheme === "dark" ? "#1b1b1b" : "#ffffff",
        };

        return next(request.set("placeholders", placeholders));
      });
    },
  };
};

export default website;
