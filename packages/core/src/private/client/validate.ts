import type ValidateInit from "#client/ValidateInit";
import type ValidationError from "#client/ValidationError";
import type { Dict, JSONPointer, JSONValue } from "@rcompat/type";
import type { Issue, JSONPayload } from "pema";

function extract(payload: JSONPayload, defaultPath: JSONPointer): Issue[] {
  // scalar: { message, messages }
  if ("messages" in payload) {
    return payload.messages.map(m => ({ message: m, path: defaultPath }));
  }
  // keyed: { "/field": { message, messages }, ... }
  const issues: Issue[] = [];
  for (const [path, bundle] of Object.entries(payload)) {
    for (const message of bundle.messages) {
      issues.push({ message, path: path as JSONPointer });
    }
  }
  return issues;
}

function focus(issues: Issue[], path?: JSONPointer): Issue[] {
  if (path === undefined) {
    return issues;
  }
  const focused = issues.filter(i => i.path === path);
  return focused.length ? focused : issues;
}

export default async function validate<T>(init: ValidateInit<T>, value: T) {
  const headers: Dict<string> = {
    "content-type": "application/json",
    ...(init.headers ?? {}),
  };
  if (init.path !== undefined) {
    headers["x-validate-path"] = init.path;
  }

  const bodyValue = init.map?.(value) ?? (value as unknown as JSONValue);

  let body: string;
  try {
    body = JSON.stringify(bodyValue);
  } catch {
    const message = "Cannot serialize body. Provide a `map` that returns JSON.";
    throw new Error(message);
  }

  const { method, url } = init;
  const response = await fetch(url, { body, headers, method });
  if (response.ok) return;

  const payload = await response.json() as JSONPayload;
  const defaultPath: JSONPointer = init.path ?? "";
  const defaultIssues = [{ message: "Validation failed", path: defaultPath }];
  const allIssues = extract(payload, defaultPath);
  const focusedIssues = focus(allIssues, init.path);
  const issues = focusedIssues.length > 0 ? focusedIssues : defaultIssues;

  throw Object.assign(new Error(issues[0].message), {
    issues,
    name: "ValidationError",
  }) as ValidationError;
}
