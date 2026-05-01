import BlobType from "#BlobType";
import Loose from "#Loose";

const vanilla = new BlobType();

const loose = new BlobType();
loose[Loose] = true;

const strict = new BlobType();
strict[Loose] = false;

const blob = { vanilla, loose, strict };

export default blob;
