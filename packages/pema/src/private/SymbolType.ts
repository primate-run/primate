import PrimitiveType from "#PrimitiveType";

export default class SymbolType extends PrimitiveType<symbol, "SymbolType"> {
  get name() {
    return "symbol" as const;
  }

  toJSON() {
    return { type: this.name };
  }
}
