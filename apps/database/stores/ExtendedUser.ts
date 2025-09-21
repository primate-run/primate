import Base from "#store/User";

export default Base.extend(User => {
  type R = typeof User.R;

  return {
    findManyById(id: R["id"]) {
      return User.find({ id });
    },
  };
});
