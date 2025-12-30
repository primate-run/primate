import extract_issues from "#client/extract-issues";
import type ValidateInit from "#client/ValidateInit";
import type ValidationError from "#client/ValidationError";
import type { Dict, JSONPointer, JSONValue } from "@rcompat/type";
import type { Issue, JSONPayload } from "pema";

function focus(issues: Issue[], path?: JSONPointer): Issue[] {
  if (path === undefined) {
    return issues;
  }
  const focused = issues.filter(i => i.path === path);
  return focused.length ? focused : issues;
}

export default async function validateField<T>(init: ValidateInit<T>, value: T) {
  const headers: Dict<string> = {
    "content-type": "application/json",
    ...(init.headers ?? {}),
  };
  if (init.path !== undefined) {
    headers["x-validate-path"] = init.path;
  }

  const body_value = init.map?.(value) ?? (value as unknown as JSONValue);

  let body: string;
  try {
    body = JSON.stringify(body_value);
  } catch {
    const message = "Cannot serialize body. Provide a `map` that returns JSON.";
    throw new Error(message);
  }

  const { method, url } = init;
  const response = await fetch(url, { body, headers, method });
  if (response.ok) return;

  const payload = await response.json() as JSONPayload;
  const default_path: JSONPointer = init.path ?? "";
  const default_issues = [{ message: "Validation failed", path: default_path }];
  const all_issues = extract_issues(payload, default_path);
  const focused_issues = focus(all_issues, init.path);
  const issues = focused_issues.length > 0 ? focused_issues : default_issues;

  throw Object.assign(new Error(issues[0].message), {
    issues,
    name: "ValidationError",
  }) as ValidationError;
}
