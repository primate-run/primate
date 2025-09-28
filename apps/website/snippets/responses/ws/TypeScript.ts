import response from "primate/response";
import route from "primate/route";

route.get(() => response.ws({
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
