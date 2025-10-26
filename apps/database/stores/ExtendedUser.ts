import Base from "#store/User";

export default Base.extend(User => {
  return {
    findByAge(age: typeof User.Schema.age) {
      return User.find({ age });
    },
  };
});
