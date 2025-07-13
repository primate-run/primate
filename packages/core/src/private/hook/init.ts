import type App from "#App";
import type Module from "#module/Module";

const reducer = async <A extends App>(modules: Module[], app: A): Promise<A> => {
  const [first, ...rest] = modules;

  if (rest.length === 0) {
    return await first.init(app, _ => _);
  };
  return await first.init(app, _ => reducer(rest, _));
};

export default async <A extends App>(app: A) => await reducer(app.modules, app);
