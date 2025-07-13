type Func = (component: {
  render(...args: any[]): {
    html: string;
    head: string;
  };
}, ...args: any[]) => {
  body: string;
  head: string;
};

export default ((component, ...args) => {
  const { html, head } = component.render(...args);
  return { body: html, head };
}) as Func;
