import E from "#errors";
import type { FileRef } from "@rcompat/fs";
import FileRouter from "@rcompat/fs/FileRouter";

const re = /^[a-zA-Z0-9\-_+[\].]+$/;
const specials = ["error", "hook", "layout"];

const p = /^(?:[^[\]]+|\[(?:\.{3})?[a-zA-Z0-9_]+\]|\[\[(?:\.{3})?[a-zA-Z0-9_]+\]\])$/;

export default async (directory: FileRef, extensions: string[]) => {
  const router = await FileRouter.load({
    directory: directory.toString(),
    extensions,
    specials: {
      error: { recursive: false },
      hook: { recursive: true },
      layout: { recursive: true },
    },
  });
  router.all().map(route => {
    const { path, segment } = route;

    if (!re.test(segment)) throw E.route_invalid_characters(path!, re);
    if (segment.startsWith("+") && !specials.includes(segment.slice(1))) {
      throw E.route_invalid_special_file(path!);
    }
    if (!p.test(segment)) throw E.route_invalid_parameter(path!, segment);
  });
  return router;
};
