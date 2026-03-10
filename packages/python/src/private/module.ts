import p from "pema";

const schema = p({
  extension: p.string.optional(),
});

const module = {
  schema,
  name: "python",
  extension: ".py",
};

type Input = typeof module.schema.input;

export type { Input };

export default module;
