import type Dict from "@rcompat/type/Dict";

export default interface Asset {
  src?: string;
  inline: boolean;
  integrity: string;
  code: string | { imports: Dict };
  type: string;
}
