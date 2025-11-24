---
title: Redirect to login page
---

To conditionally redirect to a login page based on session status, create a
guard file inside `routes` and check if the user has a valid session. If not,
redirect to `/login` with `request.target` (pathname and query string).

!!!
A guard file inside the top `routes` directory applies to all routes of your
application. If you want to limit the guard to certain routes, place it in a
subdirectory.
!!!

[s=guides/responses/redirect-to-login/guard]

---

Inside your `/login` route, read the `next` query parameter to redirect back to
the page the user came from.

[s=guides/responses/redirect-to-login/login]
