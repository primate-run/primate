import type ServeApp from "#ServeApp";
import Streamable from "@rcompat/fs/Streamable";
import type StreamSource from "@rcompat/fs/StreamSource";
import mime from "@rcompat/http/mime/application/octet-stream";

const encodeRFC5987 = (s: string) =>
  encodeURIComponent(s).replace(/['()*]/g, c =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * @security
 * risk: header injection (CWE-113)
 * assumptions:
 *   - filename may contain CR/LF and non-ASCII
 * mitigations:
 *   - strip CR/LF; escape quotes; add RFC5987 filename*
 * references: RFC 6266, RFC 5987
 */
function toContentDisposition(filename: string) {
  // prevent header injection (remove CR/LF) and limit length for safety
  const clean = filename.replace(/[\r\n]/g, "").slice(0, 255);

  // create an ASCII-safe version of the filename by replacing non-printable
  // ASCII chars and quotes/backslashes (RFC 6266)
  const ascii = clean.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");

  // encode the clean filename in UTF-8 using percent-encoding.
  // this prepares it for the 'filename*' extended parameter (RFC 5987)
  const utf8 = encodeRFC5987(clean);

  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
};

/**
 * Stream a binary response.
 * @param source streamable source
 * @param options response options
 * @return Response rendering function
 */
export default function binary(source: StreamSource, init?: ResponseInit) {
  return (app: ServeApp) => {
    const { headers, ...rest } = app.media(mime, init);
    const name = Streamable.named(source) ? source.name : "default.bin";
    const out = new Headers(headers);
    out.set("Content-Disposition", toContentDisposition(name));

    if (source instanceof Blob) {
      source.type && out.set("Content-Type", source.type);
      out.set("Content-Length", String(source.size));
    }
    return app.respond(Streamable.stream(source), {
      ...rest, headers: Object.fromEntries(out.entries()),
    });
  };
};
