import impl from "#HeadImpl";

const Head = function Head(props: { children: any[] }) {
  impl(props as any);
  return null;
};

Head.clear = impl.clear;

export default Head;
