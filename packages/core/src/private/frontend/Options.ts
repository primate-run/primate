import type Dict from "@rcompat/type/Dict";

export default interface Options extends ResponseInit {
  head?: string;
  partial?: boolean;
  placeholders?: Omit<Dict, "body" | "head">;
  page?: string;
  csp?: {
    style_src?: string[];
    script_src?: string[];
  };
};
