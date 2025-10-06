import type FileRef from "@rcompat/fs/FileRef";

function glob_to_regex(pattern: string): RegExp {
  const normalized = pattern.replace(/^\.\//, "");
  const regex = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___DOUBLESTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___DOUBLESTAR___/g, ".*")
    .replace(/\?/g, ".")
    .replace(/\\\{([^}]+)\\\}/g, (_, group) => {
      return `(${group.split(",").join("|")})`;
    });
  return new RegExp(`^${regex}$`);
}

export default async function collect(
  patterns: string[],
  root: FileRef,
): Promise<string[]> {
  const regexes = patterns.map(p => glob_to_regex(p));

  return (await root.collect((file: FileRef) => {
    const relative = file.debase(root, "/").path;

    return regexes.some(regex => regex.test(relative));
  })).map(f => f.path);
}
