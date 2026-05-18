import db from "#DB";
import Store from "#Store";

const markdown = Object.assign(db.new, { store: Store.new });

export default markdown;
