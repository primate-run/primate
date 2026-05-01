import Loose from "#Loose";
import UUIDType from "#UUIDType";

const vanilla = new UUIDType();

const loose = new UUIDType();
loose[Loose] = true;

const strict = new UUIDType();
strict[Loose] = false;

const uuid = { vanilla, loose, strict };

export default uuid;
