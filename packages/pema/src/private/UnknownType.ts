import StaticType from "#StaticType";

export default class UnknownType extends StaticType<unknown, "unknown"> {
  get name() {
    return "unknown";
  }
}
