import route from "primate/route";

export default route({
  get(request) {
    // throws if missing
    const id = request.path.get("id"); // "42" for /users/42
    return `User #${id}`;
  },
});
