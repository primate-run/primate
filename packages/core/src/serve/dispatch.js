import { MismatchedType } from "@primate/core/errors";
import { is } from "rcompat/invariant";
import * as O from "rcompat/object";
import { camelcased } from "rcompat/string";
import { tryreturn } from "rcompat/sync";
import validate from "./validate.js";

export default (patches = {}) => (object, raw, cased = true) => {
  return Object.assign(Object.create(null), {
    ...O.map(patches, ([name, patch]) => [`get${camelcased(name)}`, key => {
      is(key).defined(`\`${name}\` called without key`);
      return tryreturn(_ => validate(patch, object[key], key))
        .orelse(({ message }) => MismatchedType.throw(message));
    }]),
    get(key) {
      is(key).string();

      return object[cased ? key : key.toLowerCase()];
    },
    json() {
      return JSON.parse(JSON.stringify(object));
    },
    toString() {
      return JSON.stringify(object);
    },
    raw,
  });
};
