export default interface Script {
  id?: string;
  src?: string;
  integrity: string;
  type: string;
  code: string;
  inline: boolean;
}
