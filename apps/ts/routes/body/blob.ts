import route from "primate/route";

export default route({
  async post(request) {
    const blob = await request.body.blob();
    const buf = new Uint8Array(await blob.arrayBuffer());

    return {
      head: Array.from(buf.slice(0, 4)),
      size: buf.byteLength,
      type: blob.type || (request.headers.try("content-type") ??
        "application/octet-stream"),
    };
  },
});
