import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  const users = await User.find({});
  return users;
});

route.post(async request => {
  const user = await User.insert(request.body);
  return user;
});
