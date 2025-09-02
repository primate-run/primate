import pema from "pema";
import date from "pema/date";
import uint from "pema/uint";
import session from "primate/config/session";

// shape of session data
const SessionData = pema({
  userId: uint,
  lastActivity: date.default(() => new Date()),
});

// export configuration
export default session({
  cookie: {
    name: "sid",
    sameSite: "Strict",
  },
  schema: SessionData,
});
