import type EnvSchema from "#app/EnvSchema";
import AppFacade from "#app/Facade";
import schema from "#config/schema";
import type I18NConfig from "#i18n/Config";
import type { ObjectType } from "pema";

type ConfigInput<
  P extends EnvSchema,
  I extends I18NConfig | undefined,
> = typeof schema.input & {
  env?: { schema?: ObjectType<P> };
  i18n?: I;
};

export default function config<
  P extends EnvSchema = EnvSchema,
  const I extends I18NConfig | undefined = undefined,
>(
  input: ConfigInput<P, I> = {} as ConfigInput<P, I>,
): AppFacade<P, I> {
  return new AppFacade<P, I>(schema.parse(input as typeof schema.input));
}
