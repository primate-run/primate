type Func = (component: {
  render(...args: any[]): {
    head: string;
    html: string;
  };
}, ...args: any[]) => {
  body: string;
  head: string;
};

export default ((component, ...args) => {
  const { head, html } = component.render(...args);
  return { body: html, head };
}) as Func;
