import response from "#response";
import MIME from "@rcompat/http/mime";

type Body = {
  close?(): undefined;
  open(events: { send(name: string, data: unknown): undefined }): undefined;
};

const encode = (input: string) => new TextEncoder().encode(input);

const handle = (body: Body) => new ReadableStream({
  cancel() {
    body.close?.();
  },
  start(controller) {
    body.open({
      send(name, data) {
        const event = data === undefined ? "" : `event: ${name}\n`;
        const _data = JSON.stringify(data === undefined ? name : data);
        controller.enqueue(encode(`${event}data:${_data}\n\n`));
      },
    });
  },
});

/**
 * Open a server-sent event stream
 * @param body implementation body
 * @param options response options
 * @return Response rendering function
 */
export default response<Body>(MIME.TEXT_EVENT_STREAM, handle);
