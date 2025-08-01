import schema from "#session/schema";
import local_storage from "#session/storage";
import s_config from "#symbol/config";

export default <Data>(config: typeof schema.input = {}) => {
  const storage = local_storage<Data>();
  const session = () => storage.getStore()!;
  const validated_config = schema.validate(config);

  return {
    create(data: Data = {} as Data) {
      session().create(data);
    },
    get data() {
      return session().data;
    },
    destroy() {
      session().destroy();
    },
    get id() {
      return session().id;
    },
    get new() {
      return session().new;
    },
    get [s_config]() {
      return validated_config;
    },
  };
};
