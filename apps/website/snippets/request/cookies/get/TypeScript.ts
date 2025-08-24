import Status from "primate/response/Status";
import error from "primate/response/error";
import route from "primate/route";

route.get(request => {
  const session = request.cookies.try("session"); // string | undefined
  if (!session) {
    return error({
      body: "Unauthorized",
      status: Status.UNAUTHORIZED,
    });
  }

  return `Hello (session ${session.slice(0, 8)}...)`;
});
