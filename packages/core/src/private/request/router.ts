import E from "#errors";
import type { FileRef } from "@rcompat/fs";
import FileRouter from "@rcompat/fs/FileRouter";

const re = /^[a-zA-Z0-9\-_+[\].]+$/;
const specials = ["error", "hook", "layout"];

const p = /^(?:[^[\]]+|\[(?:\.{3})?[a-zA-Z0-9_]+\]|\[\[(?:\.{3})?[a-zA-Z0-9_]+\]\])$/;

export default async (
  directory: FileRef,
  extensions: string[],
  excluded_extensions: string[] = [],
) => {
  const escaped = extensions.map(e => e.replace(".", "\\."));
  const filter = new RegExp(`^.*(${escaped.join("|")})$`, "u");
  const route_files = (await directory.files({ filter, recursive: true }))
    .filter(file => !excluded_extensions.some(ext => file.path.endsWith(ext)))
    .map(file => {
      const extension = extensions
        .toSorted((a, b) => b.length - a.length)
        .find(extension => file.path.endsWith(extension))!;
      return file.debase(directory).path.slice(1, -extension.length);
    });
  const router = FileRouter.init({
    directory: directory.toString(),
    extensions,
    specials: {
      error: { recursive: false },
      hook: { recursive: true },
      layout: { recursive: true },
    },
  }, route_files);
  router.all().map(route => {
    const { path, segment } = route;

    if (!re.test(segment)) throw E.route_invalid_characters(path!, re);
    const special = segment.slice(1).split(".")[0];
    if (segment.startsWith("+") && !specials.includes(special)) {
      throw E.route_invalid_special_file(path!);
    }
    if (!p.test(segment)) throw E.route_invalid_parameter(path!, segment);
  });
  return router;
};
