import type ObjectType from "#ObjectType";
import OmitType from "#OmitType";
import type Parsed from "#Parsed";
import type { Dict } from "@rcompat/type";

export default function omit<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K> {
  return new OmitType(type, keys);
}
