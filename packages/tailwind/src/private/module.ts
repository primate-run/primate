import p from "pema";

const schema = p({
  content: p.array(p.string).default([
    "./views/**/*.{tsx,jsx,ts,js}",
    "./components/**/*.{tsx,jsx,ts,js}",
    "./routes/**/*.{tsx,jsx,ts,js}",
  ]),
  config: p.string.default("./tailwind.config.js"),
});

const module = {
  schema,
  name: "tailwind",
};

type Input = typeof module.schema.input;

export type { Input };

export default module;
