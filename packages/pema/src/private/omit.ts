import Loose from "#Loose";
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
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K> {
  const i = new OmitType(type, keys);
  i[Loose] = true;
  return i;
}

function strict<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
>(type: ObjectType<P>, ...keys: K[]): OmitType<P, K> {
  const i = new OmitType(type, keys);
  i[Loose] = false;
  return i;
}

const omit = { vanilla, loose, strict };

export default omit;
