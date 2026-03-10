import storage from "#request/storage";

export default {
  get() {
    return storage().getStore()?.toJSON();
  },
};
