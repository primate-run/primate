import type IssueType from "#IssueType";

type JSONIssue = {
  type: IssueType;
  message: string;
  messages: string[];
};

export type { JSONIssue as default };
