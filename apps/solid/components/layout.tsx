export default (props: any) => <>
  <ul>
    <li><a href="/">overview</a></li>
  </ul>
  <div>
    {props.children}
  </div>
</>;
