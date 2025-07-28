export default (address: string, request: Request) =>
  fetch(address, {
    headers: request.headers,
    method: request.method,
    body: request.body,
    duplex: "half",
  } as RequestInit);
