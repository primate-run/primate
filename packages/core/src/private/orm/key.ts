import ForeignKey from "#orm/ForeignKey";
import PrimaryKey from "#orm/PrimaryKey";

const key = {
  foreign: ForeignKey.new,
  primary: PrimaryKey.new,
};

export default key;
