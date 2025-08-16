import schema from "#config/schema";

export default (config: typeof schema.input = {}) => schema.parse(config);
