import uint from "pema/uint";
import route from "primate/route";
import ws from "primate/ws";

route.get(request => {
  const limit = uint.default(20).validate(+request.query.limit);

  let n = 1;
  return ws({
    open() {
      console.log("opened!");
    },
    message(socket, message) {
      if (n > 0 && n < limit) {
        n++;
        socket.send(`You wrote ${message}`);
      }
    },
  });
});
