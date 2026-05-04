import LiteralType from "#LiteralType";

type Literal = string | boolean | number;

function vanilla<T extends Literal>(literal: T) {
  return new LiteralType(literal);
}

function loose<T extends Literal>(literal: T) {
  return new LiteralType(literal, true);
}

function strict<T extends Literal>(literal: T) {
  return new LiteralType(literal, false);
}

export default { vanilla, loose, strict };
