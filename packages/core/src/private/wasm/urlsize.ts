import stringSize from "#wasm/stringsize";

export default function urlsize(url: URL) {
  return stringSize(url.toString());
}
