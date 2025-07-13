import type Dictionary from "@rcompat/type/Dictionary";

export default interface Asset {
  src?: string;
  inline: boolean;
  integrity: string;
  code: string | { imports: Dictionary };
  type: string;
}
