import type { Dict } from "@rcompat/type";

export default interface Asset {
  code: { imports: Dict } | string;
  inline: boolean;
  integrity: string;
  src?: string;
  type: string;
}
