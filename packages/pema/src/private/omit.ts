import type ObjectType from "#ObjectType";
import OmitType from "#OmitType";
import type Parsed from "#Parsed";
import type { Dict } from "@rcompat/type";

function vanilla<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K> {
  return new OmitType(type, keys);
}

function loose<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K, true> {
  return new OmitType(type, keys, true);
}

function strict<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K, false> {
  return new OmitType(type, keys, false);
}

const omit = { vanilla, loose, strict };

export default omit;
