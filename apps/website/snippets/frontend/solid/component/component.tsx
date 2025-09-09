interface Props { message: string };

export default function App(props: Props) {
  return (
    <div>
      <h1>{props.message}</h1>
    </div>
  );
}