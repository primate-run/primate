import Default from "#Default";

export type { default as Component } from "#Component";

export default (config: typeof Default.input) => new Default(config);
