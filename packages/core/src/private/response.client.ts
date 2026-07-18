function server_only(name: string): never {
  throw new Error(`response.${name}() is server-only`);
}

const redirect = Object.assign(
  () => server_only("redirect"),
  {
    external: () => server_only("redirect.external"),
    local: () => server_only("redirect.local"),
  },
);

export default {
  binary: () => server_only("binary"),
  error: () => server_only("error"),
  json: () => server_only("json"),
  redirect,
  sse: () => server_only("sse"),
  text: () => server_only("text"),
  view: () => server_only("view"),
  ws: () => server_only("ws"),
  null: () => server_only("null"),
};
