import type Dict from "@rcompat/type/Dict";

function stringify(errors: Dict<string>) {
  return JSON.stringify(errors, null, 2);
}

export default class ValidationError extends Error {
  #errors?: Dict<string>;
  #error?: string;

  constructor(errors: Dict<string> | string) {
    super(typeof errors === "string" ? errors : stringify(errors));

    this.name = "ValidationError";

    if (typeof errors === "string") {
      this.#error = errors;
    }
    if (typeof errors === "object") {
      this.#errors = errors;
    }
  }

  toJSON() {
    return {
      error: this.#error,
      errors: this.#errors,
      name: this.name,
    };
  }
}
