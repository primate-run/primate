import sizeOfString from "./size-of-string.js";

const sizeOfUrl = (url: URL) => sizeOfString(url.toString());

export default sizeOfUrl;
