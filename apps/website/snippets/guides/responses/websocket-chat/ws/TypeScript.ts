import uint from "pema/uint";
import ws from "primate/response/ws";
import route from "primate/route";

const sockets = new Set();

route.get(request => {
  // limit the number of messages a client can send
  const limit = uint.coerce.default(20).parse(request.query.get("limit"));

  let n = 1;
  return ws({
    close(socket) {
      sockets.delete(socket);
    },
    message(_, message) {
      [...sockets.values()].forEach(s => {
        if (n > 0 && n < limit) {
          n++;
          s.send(message);
        }
      });
    },
    open(socket) {
      sockets.add(socket);
    },
  });
});
