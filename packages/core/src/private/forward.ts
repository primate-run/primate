export default (target: string, request: Request) =>
  fetch(target, {
    headers: request.headers,
    method: request.method,
    body: request.body,
    duplex: "half",
  } as RequestInit);
