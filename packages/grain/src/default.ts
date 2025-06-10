import build from "#build";
import default_extension from "#extension";
import pkgname from "#pkgname";

export default (extension = default_extension) => ({
  name: pkgname,
  build: build(extension),
});
