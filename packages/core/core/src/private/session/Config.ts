import type schema from "#session/schema";

type Config = typeof schema.infer;

export type { Config as default };
