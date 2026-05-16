import User from "#store/User";
import route from "primate/route";

export default route.hook(async (request, next) => {
  await User.drop();
  await User.create();

  return next(request);
});
