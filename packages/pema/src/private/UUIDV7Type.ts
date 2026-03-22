import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";

const re = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default class UUIDV7Type
  extends PrimitiveType<string, "UUIDV7Type">
  implements Storable<"uuid_v7"> {

  get name() {
    return "string" as const;
  }

  get datatype() {
    return "uuid_v7" as const;
  }

  parse(x: unknown): Infer<this> {
    if (typeof x !== "string" || !re.test(x)) {
      throw new Error(`"${x}" is not a valid UUID v7`);
    }
    return x as Infer<this>;
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
