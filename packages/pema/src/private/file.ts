import FileType from "#FileType";
import Loose from "#Loose";

const vanilla = new FileType();

const loose = new FileType();
loose[Loose] = true;

const strict = new FileType();
strict[Loose] = false;

const file = { vanilla, loose, strict };

export default file;
