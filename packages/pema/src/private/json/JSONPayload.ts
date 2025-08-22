import type JSONIssue from "#json/JSONIssue";
import type JSONPointer from "@rcompat/type/JSONPointer";

type JSONPayload = JSONIssue | Record<JSONPointer, JSONIssue>;

export type { JSONPayload as default };
