import schema from "#config/schema";

export default (config: typeof schema.input = {}) => {
  const validated_config = schema.validate(config);

  return validated_config;
};
