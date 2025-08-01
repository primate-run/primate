export default (address: string, request: Request) =>
  fetch(address, {
    body: request.body,
    duplex: "half",
    headers: request.headers,
    method: request.method,
  } as RequestInit);
