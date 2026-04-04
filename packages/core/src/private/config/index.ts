import type EnvSchema from "#app/EnvSchema";
import AppFacade from "#app/Facade";
import schema from "#config/schema";
import type { ObjectType } from "pema";

export default function config<P extends EnvSchema = EnvSchema>(
  input: typeof schema.input & {
    env?: { schema?: ObjectType<P> };
  } = {},
): AppFacade<P> {
  return new AppFacade<P>(schema.parse(input as typeof schema.input));
}
