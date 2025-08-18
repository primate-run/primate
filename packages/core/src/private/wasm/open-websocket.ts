import websocket from "#response/ws";
import type Instantiation from "#wasm/Instantiation";
import encodeWebsocketClose from "#wasm/encode-websocket-close";
import encodeWebsocketMessage from "#wasm/encode-websocket-message";
import encodeWebsocketOpen from "#wasm/encode-websocket-open";

export default (websocketId: bigint) =>
  (api: Instantiation) => {
    return websocket({
      close(_socket) {
        const socketClosePayload = encodeWebsocketClose(websocketId);
        api.sockets.delete(websocketId);
        api.setPayload(socketClosePayload);
        api.exports.websocketClose();
      },
      message(_socket, message) {
        const socketMessagePayload = encodeWebsocketMessage(websocketId, message);
        api.setPayload(socketMessagePayload);
        api.exports.websocketMessage();
      },
      open(socket) {
        const socketOpenPayload = encodeWebsocketOpen(websocketId);
        api.sockets.set(websocketId, socket);
        api.setPayload(socketOpenPayload);
        api.exports.websocketOpen();
      },
    });
  };
