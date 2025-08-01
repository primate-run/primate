import websocket from "#handler/ws";
import type Instantiation from "#wasm/Instantiation";
import encodeWebsocketClose from "./encode-websocket-close.js";
import encodeWebsocketMessage from "./encode-websocket-message.js";
import encodeWebsocketOpen from "./encode-websocket-open.js";

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
