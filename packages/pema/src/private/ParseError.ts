import type ParseIssue from "#ParseIssue";
import type Dict from "@rcompat/type/Dict";

function stringify(issue: ParseIssue) {
  const key = issue.key;
  if (key === undefined) {
    return issue.message;
  }
  return `${key.startsWith(".") ? "" : "."}${key}: ${issue.message}`;
}

type JSONIssue = {
  message: string;
  messages: string[];
};

export default class ParseError extends Error {
  #issues?: ParseIssue[];

  constructor(issues: ParseIssue[]) {
    super(typeof issues === "string" ? issues : stringify(issues[0]));

    this.name = "ParseError";

    if (typeof issues === "object") {
      this.#issues = issues;
    }
  }

  get issues() {
    return this.#issues;
  }

  toJSON() {
    if (!this.#issues || this.#issues.length === 0) {
      return { message: "Parsing failed", messages: ["Parsing failed"] };
    }

    const form = this.#issues.some(i => i.key);

    if (!form) {
      const messages = this.#issues.map(i => i.message);
      return {
        message: messages[0],
        messages,
      } as JSONIssue;
    }

    return this.#issues
      .filter(issue => issue.key !== undefined)
      .reduce((issues, issue) => {
        const key = issue.key!;

        if (!(key in issues)) {
          issues[key] = { message: issue.message, messages: [] };
        }
        issues[key].messages.push(issue.message);

        if (issues[key].messages.length === 1) {
          issues[key].message = issue.message;
        }
        return issues;
      }, {} as Dict<JSONIssue>);
  }
}
