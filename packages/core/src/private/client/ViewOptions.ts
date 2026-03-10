import type { Dict } from "@rcompat/type";

export default interface ViewOptions extends ResponseInit {
  csp?: {
    script_src?: string[];
    style_src?: string[];
  };
  head?: string;
  page?: string;
  partial?: boolean;
  placeholders?: Omit<Dict, "body" | "head">;
};
