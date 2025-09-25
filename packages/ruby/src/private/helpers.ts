function integer(n: number) {
  return Number.isInteger(n);
}

export default {
  type(value: unknown) {
    if (typeof value === "number") return integer(value) ? "integer" : "float";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") return "string";
    if (typeof value === "object") {
      if (Array.isArray(value)) return "array";
      if (value === null) return "nil";
      return "object";
    }

    return undefined;
  },
};
