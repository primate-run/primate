function server_only(name: string): never {
  throw new Error(`response.${name}() is server-only`);
}

export default {
  binary: () => server_only("binary"),
  error: () => server_only("error"),
  json: () => server_only("json"),
  redirect: () => server_only("redirect"),
  sse: () => server_only("sse"),
  text: () => server_only("text"),
  view: () => server_only("view"),
  ws: () => server_only("ws"),
  null: () => server_only("null"),
};
