import LiteralType from "#LiteralType";
import Loose from "#Loose";

type Literal = string | boolean | number;

function vanilla<T extends Literal>(literal: T) {
  return new LiteralType(literal);
}

function loose<T extends Literal>(literal: T) {
  const i = new LiteralType(literal);
  i[Loose] = true;
  return i;
}

function strict<T extends Literal>(literal: T) {
  const i = new LiteralType(literal);
  i[Loose] = false;
  return i;
}

const literal = { vanilla, loose, strict };

export default literal;
