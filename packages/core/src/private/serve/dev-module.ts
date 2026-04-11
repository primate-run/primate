import create from "#module/create";
import c from "@rcompat/cli/color";

function pass(address: string, request: Request) {
  return fetch(address, {
    body: request.body,
    duplex: "half",
    headers: request.headers,
    method: request.method,
  } as RequestInit);
}

export default function dev() {
  let paths: string[];
  let reload: string;

  return create({
    name: "builtin/dev",
    setup({ onServe, onHandle }) {
      onServe(app => {
        const { host, port } = app.livereload;
        const assets = app.assets.map(asset => asset.src);
        reload = `http://${host}:${port}`;
        paths = ["/esbuild"].concat(assets as string[]);
        app.log.print`↻ live reload ${c.dim(reload)}\n`;
      });

      onHandle((request, next) => {
        const { pathname } = new URL(request.url);

        return paths.includes(pathname)
          ? pass(`${reload}${pathname}`, request.original)
          : next(request);
      });
    },
  });
}
