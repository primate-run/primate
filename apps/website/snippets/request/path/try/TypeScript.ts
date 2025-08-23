import route from "primate/route";

route.get(request => {
  const year = request.path.get("year");
  const slug = request.path.try("slug"); // string | undefined
  return slug ? `Post ${slug} from ${year}` : `All posts in ${year}`;
});
