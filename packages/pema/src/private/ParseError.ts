import type JSONIssue from "#json/JSONIssue";
import type JSONPayload from "#json/JSONPayload";
import type ParseIssue from "#ParseIssue";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { JSONPointer, Serializable } from "@rcompat/type";

function humanize(path: JSONPointer): string {
  return path === ""
    ? ""
    : path
      .slice(1)
      .split("/")
      .map(seg => seg.replace(/~1/g, "/").replace(/~0/g, "~"))
      .map(seg => `.${seg}`)
      .join("")
    ;
}

function stringify(issue: ParseIssue) {
  // for root (scalar) errors, keep just the message;
  // otherwise prefix with humanized path
  return issue.path === ""
    ? issue.message
    : `${humanize(issue.path)}: ${issue.message}`
    ;
}

const brand = Symbol.for("pema/ParseError/v0");

export default class ParseError extends Error implements Serializable {
  [brand] = true;
  #issues: ParseIssue[] = [];

  static is(x: unknown): x is ParseError {
    return is.branded(x, brand);
  }

  constructor(issues: ParseIssue[]) {
    super(stringify(issues[0]));
    this.name = "ParseError";
    this.#issues = issues;
  }

  get issues() {
    return this.#issues;
  }

  toJSON(): JSONPayload {
    const issues = this.#issues;

    assert.uint(issues.length);

    const is_form = issues.some(i => i.path !== "");

    if (!is_form) {
      const messages = issues.map(i => i.message);
      return {
        type: issues[0].type,
        message: messages[0],
        messages,
      } as JSONIssue;
    }

    const payload: Partial<Record<JSONPointer, JSONIssue>> = {};
    for (const i of issues) {
      const key = i.path;
      if (!(key in payload)) payload[key] = {
        type: i.type,
        message: i.message,
        messages: [],
      };
      const entry = payload[key]!;
      entry.messages.push(i.message);
    }
    return payload as JSONPayload;

  }
}
