---
title: Redirect to login page
---

To conditionally redirect to a login page based on session status, create a
hook file inside `routes` and check if the user has a valid session. If not,
redirect locally to `/login` and pass `request.target` as a structured `next`
query value. Structured serialization prevents characters in the target from
changing the surrounding login URL.

!!!
A hook file inside the top `routes` directory applies to all routes of your
application. If you want to limit the hook to certain routes, place it in a
subdirectory.
!!!

[s=guides/responses/redirect-to-login/hook]

---

Inside your `/login` route, read the `next` query parameter and pass it to the
local redirect helper. The helper rejects absolute, protocol-relative and
malformed targets, so attacker-controlled input cannot redirect to another
origin. After a successful login form submission, use `303 See Other` to switch
the follow-up request to `GET`; `307` and `308` would preserve the form method
and body.

[s=guides/responses/redirect-to-login/login]
