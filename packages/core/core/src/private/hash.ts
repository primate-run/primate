import crypto from "@rcompat/crypto";

const encoder = new TextEncoder();

async function hash(data: string, algorithm = "sha-384") {
  const bytes = await crypto.subtle.digest(algorithm, encoder.encode(data));
  const prefix = algorithm.replace("-", _ => "");
  return`${prefix}-${btoa(String.fromCharCode(...new Uint8Array(bytes)))}`;
};

export default hash;
