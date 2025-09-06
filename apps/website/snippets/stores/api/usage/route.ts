import APIStore from "#store/APIStore";
import route from "primate/route";

route.get(async () => {
  const data = await APIStore.find();
  return data;
});