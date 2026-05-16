import p from "pema";
import session from "primate/session";

// shape of session data
const SessionData = p({
  userId: p.uint,
  lastActivity: p.date.default(() => new Date()),
});

// export configuration
export default session({
  cookie: {
    name: "sid",
    sameSite: "Strict",
  },
  schema: SessionData,
});
