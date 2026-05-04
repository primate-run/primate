import PureType from "#PureType";

function vanilla<T>() {
  return new PureType<T>();
}

function loose<T>() {
  return new PureType<T>();
}

function strict<T>() {
  return new PureType<T>();
}

const pure = { vanilla, loose, strict };

export default pure;
