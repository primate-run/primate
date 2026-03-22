import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";

const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default class UUIDV4Type
  extends PrimitiveType<string, "UUIDV4Type">
  implements Storable<"uuid_v4"> {

  get name() {
    return "string" as const;
  }

  get datatype() {
    return "uuid_v4" as const;
  }

  parse(x: unknown): Infer<this> {
    if (typeof x !== "string" || !re.test(x)) {
      throw new Error(`"${x}" is not a valid UUID v4`);
    }
    return x as Infer<this>;
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
