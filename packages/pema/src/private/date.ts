import DateType from "#DateType";

const vanilla = new DateType();
const loose = new DateType(true);
const strict = new DateType(false);

const date = { vanilla, loose, strict };

export default date;
