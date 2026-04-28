import User from "#store/User";
import hook from "primate/route/hook";

export default hook(async (request, next) => {
  await User.drop();
  await User.create();

  return next(request);
});
