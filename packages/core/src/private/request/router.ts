import AppError from "#AppError";
import fail from "#fail";
import type { FileRef } from "@rcompat/fs";
import FileRouter from "@rcompat/fs/FileRouter";

const error_entries = Object.entries({
  DoubleRoute: "double route {0}, disambiguate routes",
  OptionalRoute: "optional route {0} may not be a directory",
  RestRoute: "rest route {0} may not be a directory",
});

const allowed = {
  re: /^[a-zA-Z0-9\-_+[\].]+$/,
  replacements: ["a-Z", "0-9", "-", "_", "+", "[", "]", "."],
  text: "letters ({1}), digits ({2}), {3}, {4}, {5}, {6}, {7}",
};
const specials = ["error", "hook", "layout"];
const _ = allowed.re.source.slice(1, -1);

const p = /^(?:[^[\]]+|\[(?:\.{3})?[a-zA-Z0-9_]+\]|\[\[(?:\.{3})?[a-zA-Z0-9_]+\]\])$/;

export default async (directory: FileRef, extensions: string[]) => {
  try {
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

      if (!allowed.re.test(segment)) {
        const message = `route {0} may only contain ${allowed.text}`;
        throw fail(message, path, ...allowed.replacements);
      }
      if (segment.startsWith("+") && !specials.includes(segment.slice(1))) {
        throw fail("route {0} is not a valid special file", path);
      }
      if (!p.test(segment)) {
        throw fail("route {0} has an invalid parameter", path);
      }
    });
    return router;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    error_entries.forEach(([key, value]) => {
      if (key in FileRouter.Error) {
        throw new AppError(value, (error as { route: string }).route);
      }
    });
    // rethrow original error
    throw error;
  }
};
