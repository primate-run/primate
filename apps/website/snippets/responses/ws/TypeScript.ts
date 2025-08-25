import ws from "primate/response/ws";
import route from "primate/route";

route.get(() => ws({
  open(socket) {
    socket.send("hello");
  },
  message(socket, message) {
    // echo
    socket.send(String(message));
  },
  close(socket) {
    console.log("socket closed");
  },
}));
