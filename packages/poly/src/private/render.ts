type Func = (view: {
  render(...args: any[]): {
    head: string;
    html: string;
  };
}, ...args: any[]) => {
  body: string;
  head: string;
};

export default ((view, ...args) => {
  const { head, html } = view.render(...args);
  return { body: html, head };
}) as Func;
