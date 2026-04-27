import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.ws({
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
    });
  },
});
