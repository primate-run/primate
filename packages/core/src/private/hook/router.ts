import AppError from "#AppError";
import type FileRef from "@rcompat/fs/FileRef";
import Router from "@rcompat/fs/router";
import type Dict from "@rcompat/type/Dict";

const error_entries = Object.entries({
  DoubleRoute: "double route {0}, disambiguate routes",
  OptionalRoute: "optional route {0} may not be a directory",
  RestRoute: "rest route {0} may not be a directory",
});

type Return = ReturnType<typeof Router.load>;

export default async (directory: FileRef, extensions: string[]): Return => {
  try {
    return await Router.load({
      import: false,
      extensions,
      directory: directory.toString(),
      specials: {
        guard: { recursive: true },
        error: { recursive: false },
        layout: { recursive: true },
      },
      predicate(route, request) {
        return (route.default as Dict)[request.method.toLowerCase()] !== undefined;
      },
    });
  } catch (error) {
    error_entries.forEach(([key, value]) => {
      if (key in Router.Error) {
        throw new AppError(value, (error as { route: string }).route);
      }
    });
    // rethrow original error
    throw error;
  }
};
