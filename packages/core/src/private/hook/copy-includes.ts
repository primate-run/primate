import type BuildApp from "#BuildApp";
import location from "#location";

export default async (app: BuildApp, type: string) => {
  const includes = app.config("build.includes");
  const reserved = Object.values(location);

  if (Array.isArray(includes)) {
    await Promise.all(includes
      .filter(include => !reserved.includes(include))
      .filter(include => /^[^/]*$/u.test(include))
      .map(async include => {
        const path = app.root.join(include);
        if (await path.exists()) {
          await path.copy(app.runpath(type, include));
        }
      }));
  }
};
