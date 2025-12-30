import type { JSONPointer } from "@rcompat/type";
import type { Issue, JSONPayload } from "pema";

export default function extractIssues(
  payload: JSONPayload,
  defaultPath: JSONPointer | "" = "",
): Issue[] {
  // scalar: { message, messages }
  if ("messages" in payload) {
    return payload.messages.map(m => ({
      message: m,
      // for forms, defaultPath is "", but Issue.path expects a JSONPointer
      // so we cast here; form-level errors are handled separately anyway
      path: defaultPath as JSONPointer,
    }));
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
