import ValidatedKey from "#ValidatedKey";
import type ValidationOptions from "#ValidationOptions";

export default abstract class Validated<StaticType> {
  get [ValidatedKey](): "ValidatedKey" {
    return "ValidatedKey";
  }

  get infer() {
    return undefined as StaticType;
  }

  abstract get name(): string;

  abstract validate(x: unknown, options?: ValidationOptions): StaticType;
}
