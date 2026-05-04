import URLType from "#URLType";

const vanilla = new URLType();
const loose = new URLType(true);
const strict = new URLType(false);

const url = { vanilla, loose, strict };

export default url;
