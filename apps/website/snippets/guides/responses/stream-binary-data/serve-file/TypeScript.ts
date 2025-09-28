// routes/file.ts
import route from "primate/route";
import response from "primate/response";
import FileRef from "@rcompat/fs/FileRef";

const file = new FileRef("path/to/file.pdf");

route.get(() => response.stream(file));