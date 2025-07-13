import session from "#session";

export default {
  get() {
    session.create({ foo: "bar" });

    return session.data;
  },
};
