import route from "primate/route";

route.post(async request => {
  const blob = request.body.binary();
  const buf = new Uint8Array(await blob.arrayBuffer());

  return {
    head: Array.from(buf.slice(0, 4)),
    size: buf.byteLength,
    type: blob.type || (request.headers["content-type"] ??
      "application/octet-stream"),
  };
});
