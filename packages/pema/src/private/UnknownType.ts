import PureType from "#PureType";

export default class UnknownType extends PureType<unknown, "unknown"> {
  get name() {
    return "unknown";
  }
}
