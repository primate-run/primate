import type BuildApp from "#BuildApp";
import location from "#location";
import FileRef from "@rcompat/fs/FileRef";

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
          const target = FileRef.join(type, include);
          await app.stage(path, target);
        }
      }));
  }
};
