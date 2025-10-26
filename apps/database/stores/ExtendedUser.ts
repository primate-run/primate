import Base from "#store/User";

export default Base.extend(User => {
  return {
    findManyById(id: typeof User.Schema.id) {
      return User.find({ id });
    },
  };
});
