import type { FileRef } from "@rcompat/fs";
import runtime from "@rcompat/runtime";
import type { OnResolveArgs } from "esbuild";

function is_bare(path: string) {
  return /^[a-z]/.test(path);
}

function is_npm_package(path: string, resolve_dir: string) {
  if (!path.startsWith("@")) return false;
  const parts = path.split("/");
  if (parts.length < 2) return false;
  const pkg = parts[0] + "/" + parts[1];
  try {
    runtime.resolve(pkg, resolve_dir);
    return true;
  } catch {
    return false;
  }
}

export default function intercept(args: OnResolveArgs, views: FileRef) {
  if (!args.resolveDir.startsWith(views.path)) return true;
  if (is_bare(args.path)) return true;
  if (is_npm_package(args.path, args.resolveDir)) return true;
  return false;
}
