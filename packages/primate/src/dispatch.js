import { is, maybe } from "rcompat/invariant";
import { tryreturn } from "rcompat/sync";
import { map } from "rcompat/object";
import { camelcased } from "rcompat/string";
import errors from "./errors.js";
import validate from "./validate.js";

export default (patches = {}) => (value, raw, cased = true) => {
  return Object.assign(Object.create(null), {
    ...map(patches, ([name, patch]) => [`get${camelcased(name)}`, property => {
      is(property).defined(`\`${name}\` called without property`);
      return tryreturn(_ => validate(patch, value[property], property))
        .orelse(({ message }) => errors.MismatchedType.throw(message));
    }]),
    get(property) {
      maybe(property).string();
      return property === undefined ? value :
        value[cased ? property : property.toLowerCase()];
    },
    raw,
  });
};
