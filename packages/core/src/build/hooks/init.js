import { cascade } from "rcompat/async";

export default async app => (await cascade(app.modules.init))(app);
