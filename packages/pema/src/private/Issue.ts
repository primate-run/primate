import type IssueType from "#IssueType";
import type { JSONPointer } from "@rcompat/type";

export default interface Issue {
  readonly type: IssueType;
  readonly message: string;
  readonly path: JSONPointer;
}
