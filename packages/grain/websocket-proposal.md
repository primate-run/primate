# ABI Proposal:

The apis will be shaped with these types:

```ts
// Wasm exports from the module
type WebSocketWasmExports = {
  /**
   * Websocket Open is simply a callback into the wasm module.
   * A payload will be required with the following structure:
   * 
   * - [websocket_id: u64]
   */
  websocketOpen(): void;

  // TODO: websocketError and friends

  /**
   * Websocket Message is a callback that happens in the wasm module
   * when a message is received. The host will be required to notify
   * the wasm module which socket received a message, and the message
   * itself.
   * 
   * It has the following structure:
   * 
   * - [websocket_id: u64]
   * - [kind: buffer = 0, string = 1]
   * - [byte_length: u32]
   * - [bytes: u8[]]
   */
  websocketMessage(): void;
  /**
   * Tell the wasm module to clean up it's references to the wasm module.
   * 
   * Structure:
   * - [websocket_id: u64]
   */
  websocketClose(): void;
}

// Wasm imports the web assembly module can use
type WebSocketWasmImports = {
  /**
   * The web assembly module needs to notify the host when to send a message.
   * Messages can be either strings or bytes.
   * 
   * The outgoing payload needs to look like this:
   * 
   * - [websocket_id: u64]
   * - [kind: buffer = 0, string = 1]
   * - [byte_length: u32]
   * - [bytes: u8[]]
   */
  websocketSend(ptr: i32): void;
  /**
   * Sometimes a web socket needs to be closed from the server side.
   * 
   * The outgoing payload looks like this:
   * 
   * - [websocket_id: u64]
   */
  websocketClose(ptr: i32): void;
}
```

Additionally, repsonses must contain a unique identifier for the web socket itself.

$$
\begin{aligned}
response\_upgrade &∷ \mathtt{0x7} &: \mathtt{u32}\ &\text{[upgrade kind header]} \\
&∷\mathtt{websocket\_id} &: \mathtt{u64}\ & \text{[websocket id]}
\end{aligned}
$$

Wasm needs to notify JS to upgrade a request via a response to upgrade the connection.

The grain api will look like this:

```rs
provide let ws = (
  open = Option(OpenWebSocketCallback),
  message = Option(MessageWebSocketCallback),
  close = Option(CloseWebSocketCallback),
) => Response
```

Internally the ABI will assume that the web socket api can reference this `websocket_id` and call into web assembly with some payloads.

This will start  in the `deserialize-response.ts` file when the response is deserialized, but the web socket logic will happen in a new file called `websocket.ts`.

All of the ABI callbacks will exist inside a closure that remembers this websocket id and uses it to control the wasm module which should internally manage a map of some kind, linking the `websocket_id` to the callbacks themselves.

There are many reasons for this:

1. We don't know how the module *wants* to keep track of callbacks (via `func.ref` or `i32` function indexes using `call_indirect`)
2. We still have to pass off the data to the wasm module which can still happen via the standardized payload `receive` function.


