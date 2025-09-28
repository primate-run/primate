// routes/file.ts
import FileRef from "@rcompat/fs/FileRef";
import response from "primate/response";
import route from "primate/route";

const file = new FileRef("path/to/file.pdf");

route.get(() => response.binary(file));
