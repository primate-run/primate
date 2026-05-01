import Loose from "#Loose";
import SymbolType from "#SymbolType";

const vanilla = new SymbolType();

const loose = new SymbolType();
loose[Loose] = true;

const strict = new SymbolType();
strict[Loose] = false;

const symbol = { vanilla, loose, strict };

export default symbol;
