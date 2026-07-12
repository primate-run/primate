import response from "#response";
import http from "@rcompat/http";

type Source = { send(name: string, data: unknown): void };
type Cleanup = void | (() => void);
type Body = (source: Source) => Cleanup;

const encode = (input: string) => new TextEncoder().encode(input);

const handle = (body: Body) => {
  let cleanup: Cleanup;

  return new ReadableStream({
  cancel() {
    cleanup?.();
  },
  start(controller) {
    cleanup = body({
      send(name, data) {
        const event = data === undefined ? "" : `event: ${name}\n`;
        const _data = JSON.stringify(data === undefined ? name : data);
        controller.enqueue(encode(`${event}data:${_data}\n\n`));
      },
    });
  },
  });
};

/**
 * Open a server-sent event stream
 * @param body implementation body
 * @param options response options
 * @return Response rendering function
 */
export default response<Body>(http.MIME.TEXT_EVENT_STREAM, handle);
