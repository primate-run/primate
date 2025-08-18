import uint from "pema/uint";
import ws from "primate/response/ws";
import route from "primate/route";

route.get(request => {
  const limit = uint.default(20).parse(+request.query.limit!);

  let n = 1;
  return ws({
    message(socket, message) {
      if (n > 0 && n < limit) {
        n++;
        socket.send(`You wrote ${message}`);
      }
    },
    open() {
      console.log("opened!");
    },
  });
});
