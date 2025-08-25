import stringsize from "#wasm/stringsize";

export default function urlsize(url: URL) {
  return stringsize(url.toString());
}
