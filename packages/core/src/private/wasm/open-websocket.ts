import type { Instantiation } from "./instantiate.js";
import websocket from "#handler/ws";
import encodeWebsocketOpen from "./encode-websocket-open.js";
import encodeWebsocketMessage from "./encode-websocket-message.js";
import encodeWebsocketClose from "./encode-websocket-close.js";
export default (websocketId: bigint) =>
    (api: Instantiation) =>
      websocket({
        open(socket) {
          const socketOpenPayload = encodeWebsocketOpen(websocketId);
          api.sockets.set(websocketId, socket);
          api.setPayload(socketOpenPayload);
          api.exports.websocketOpen();
        },
        message(_socket: WebSocket, message) {
          const socketMessagePayload = encodeWebsocketMessage(websocketId, message);
          api.setPayload(socketMessagePayload);
          api.exports.websocketMessage();
        },
        close(_socket) {
          const socketClosePayload = encodeWebsocketClose(websocketId);
          api.sockets.delete(websocketId);
          api.setPayload(socketClosePayload);
          api.exports.websocketClose();
        },
      });