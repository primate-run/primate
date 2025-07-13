export default {
  wrap(value: unknown) {
    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return "integer";
      }
      return "float";
    }
    if (typeof value === "boolean") {
      return "boolean";
    }
    if (typeof value === "string") {
      return "string";
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return "array";
      }

      if (value === null) {
        return "nil";
      }

      return "object";
    }

    return undefined;
  },
};
