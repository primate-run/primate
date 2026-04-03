type IssueType =
  | "invalid_type"
  | "invalid_format"
  | "too_small"
  | "too_large"
  | "out_of_range"
  | "not_in_set"
  | "duplicate"
  // not a parse error
  | "network_error"
  ;

export type { IssueType as default };
