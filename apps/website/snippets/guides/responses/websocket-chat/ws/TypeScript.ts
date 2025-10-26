import p from "pema";
import response from "primate/response";
import route from "primate/route";

const sockets = new Set<any>();

route.get(request => {
  // limit the number of messages a client can send
  const limit = p.uint.coerce.default(20).parse(request.query.get("limit"));
  let n = 1;
  return response.ws({
    close(socket) {
      sockets.delete(socket);
    },
    message(_, message) {
      [...sockets.values()].forEach(socket => {
        if (n > 0 && n < limit) {
          n++;
          socket.send(message);
        }
      });
    },
    open(socket) {
      sockets.add(socket);
    },
  });
});
