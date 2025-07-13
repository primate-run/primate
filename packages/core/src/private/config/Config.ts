import type schema from "#config/schema";

type Config = typeof schema.infer;

export type { Config as default };
