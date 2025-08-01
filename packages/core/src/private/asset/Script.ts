export default interface Script {
  code: string;
  id?: string;
  inline: boolean;
  integrity: string;
  src?: string;
  type: string;
}
