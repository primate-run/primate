import double_route from "#error/double-route";
import optional_route from "#error/optional-route";
import rest_route from "#error/rest-route";
import type FileRef from "@rcompat/fs/FileRef";
import Router from "@rcompat/fs/router";
import type Dictionary from "@rcompat/type/Dictionary";

const error_entries = Object.entries({
  DoubleRoute: double_route,
  OptionalRoute: optional_route,
  RestRoute: rest_route,
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
          return (route.default as Dictionary)[request.method.toLowerCase()] !== undefined;
        },
      });
  } catch (error) {
    error_entries.forEach(([key, value]) =>
      key in Router.Error && value((error as { route: string }).route),
    );
    // rethrow original error
    throw error;
  }
};
