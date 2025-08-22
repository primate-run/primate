import type ParseIssue from "#ParseIssue";

export default function messagesOf(issues: ParseIssue[]) {
  return issues.map(i => i.message);
}
