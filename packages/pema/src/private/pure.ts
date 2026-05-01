import Loose from "#Loose";
import PureType from "#PureType";

function vanilla<T>() {
  return new PureType<T>();
}

function loose<T>() {
  const i = new PureType<T>();
  i[Loose] = true;
  return i;
}

function strict<T>() {
  const i = new PureType<T>();
  i[Loose] = false;
  return i;
}

const pure = { vanilla, loose, strict };

export default pure;
