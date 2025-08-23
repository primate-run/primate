import SchemaError from "#SchemaError";

export default function schemafail(message: string, ...args: unknown[]) {
  return new SchemaError(message, ...args);
}
