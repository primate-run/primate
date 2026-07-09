import type route from "#route/route-client/props-type";

export default function PropsType(props: typeof route.get.View) {
  return <span id="result">{props.message}</span>;
}
