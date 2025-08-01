import AppError from "#AppError";
import type FileRef from "@rcompat/fs/FileRef";
import FileRouter from "@rcompat/fs/FileRouter";

const error_entries = Object.entries({
  DoubleRoute: "double route {0}, disambiguate routes",
  OptionalRoute: "optional route {0} may not be a directory",
  RestRoute: "rest route {0} may not be a directory",
});

export default async (directory: FileRef, extensions: string[]) => {
  try {
    return await FileRouter.load({
      directory: directory.toString(),
      extensions,
      specials: {
        error: { recursive: false },
        guard: { recursive: true },
        layout: { recursive: true },
      },
    });
  } catch (error) {
    error_entries.forEach(([key, value]) => {
      if (key in FileRouter.Error) {
        throw new AppError(value, (error as { route: string }).route);
      }
    });
    // rethrow original error
    throw error;
  }
};
