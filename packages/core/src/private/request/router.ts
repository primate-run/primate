import AppError from "#AppError";
import type FileRef from "@rcompat/fs/FileRef";
import FileRouter from "@rcompat/fs/FileRouter";

const error_entries = Object.entries({
  DoubleRoute: "double route {0}, disambiguate routes",
  OptionalRoute: "optional route {0} may not be a directory",
  RestRoute: "rest route {0} may not be a directory",
});

const allowed = {
  re: /^[a-z0-9\-_+[\].]+$/,
  replacements: ["a-z", "0-9", "-", "_", "+", "[", "]", "."],
  text: "lowercase letters ({1}), digits ({2}), {3}, {4}, {5}, {6}, {7}",
};
const specials = ["guard", "error", "layout"];

const p = /^(?:[^[\]]+|\[(?:\.{3})?[a-z0-9_]+\]|\[\[(?:\.{3})?[a-z0-9_]+\]\])$/;

export default async (directory: FileRef, extensions: string[]) => {
  try {
    const router = await FileRouter.load({
      directory: directory.toString(),
      extensions,
      specials: {
        error: { recursive: false },
        guard: { recursive: true },
        layout: { recursive: true },
      },
    });
    router.all().map(route => {
      const { fullpath, path } = route;

      if (!allowed.re.test(path)) {
        const message = `route {0} may only contain ${allowed.text}`;
        throw new AppError(message, fullpath, ...allowed.replacements);
      }
      if (path.startsWith("+") && !specials.includes(path.slice(1))) {
        throw new AppError("route {0} is not a valid special file", fullpath);
      }
      if (!p.test(path)) {
        throw new AppError("route {0} has an invalid parameter", fullpath);
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
