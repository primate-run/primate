import type ParseIssue from "#ParseIssue";

export default function pathsOf(issues: ParseIssue[]) {
  return issues.map(i => i.path);
}
