import Base from "@/stores/User";

export default Base.extend(User => {
  return {
    findByAge(age: typeof User.Schema.age) {
      return User.find({ where: { age } });
    },
  };
});
