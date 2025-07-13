import mark from "#mark";
import Router from "@rcompat/fs/router";
import get from "@rcompat/record/get";
import route from "./route.js";

const numeric = (id, property) => {
  if (/^\d*$/u.test(id)) {
    return Number(id);
  }
  throw new Error(`\`${property}\` not numeric`);
};
const id = name => (value, property) => {
  if (value === name) {
    return value;
  }
  throw new Error(`\`${property}\` not equal \`${name}\` (given \`${value}\`)`);
};

const r = (route, expected = route) => [route, {
  default: {
    get() {
      return expected;
    },
  },
}];

const app = {
  get: config_key => get({
    location: {
      routes: "/routes",
    },
  }, config_key),
  headers: () => ({}),
  modules: {
    route: [],
  },
  router: Router.init({}, [
    "index",
    "user",
    "users/[userId]a",
    "comments/[commentId]",
    "users/[userId]/comments/[commentId]",
    // "users/[userId=user]/comments/[commentId]/a",
    // "users/[userId=user]/comments/[commentId]/b",
    // "users/[_userId]/comments/[commentId]/d",
    // "users/[_userId]/comments/[_commentId]/e",
    // "comments2/[_commentId]",
    // "users2/[_userId]/[_commentId]",
    // "users3/[_userId]/[_commentId]",
    // "users4/[_userId]/[_commentId]",
    // "users5/[n=n]",
    // "users6/[nv=nv]",
    // "[id]/[Id]/[ID]",
  ].map(r)),
  types: {
    user: numeric,
    comment: numeric,
    _userId: numeric,
    _commentId: numeric,
    n(value, property) {
      const n = Number(value);
      if (!Number.isNaN(n)) {
        return n;
      }
      throw new Error(`\`${property}\` not numeric`);
    },
    nv: {
      validate(value, property) {
        const n = Number(value);
        if (!Number.isNaN(n)) {
          return n;
        }
        throw new Error(`\`${property}\` not numeric`);
      },
    },
    id: id("id"),
    Id: id("Id"),
    ID: id("ID"),
  },
};

export default test => {
  const router = route(app);
  const p = "https://p.com";
  const r = pathname => {
    const original = new Request(`${p}${pathname}`, { method: "GET" });
    const { url } = original;
    const end = -1;
    return router({
      original,
      url: new URL(url.endsWith("/") ? url.slice(0, end) : url),
    });
  };

  test.reassert(assert => ({
    match: (url, expected) => {
      try {
        assert(r(url).pathname.toString()).equals(expected.toString());
      } catch {
        assert.fail();
      }
    },
    fail: (url, result) => {
      const reason = mark("no {0} route to {1}", "get", result ?? url);
      assert(() => r(url)).throws(reason);
    },
    path: (url, result) => {
      assert(r(url).path).equals(result);
    },
    assert,
  }));

  test.case("index route", ({ match }) => {
    match("/", /^\/$/u);
  });
  test.case("simple route", ({ match }) => {
    match("/user", /^\/user$/u);
  });
  test.case("param match/fail", ({ match, fail }) => {
    const re = /^\/users\/(?<userId>[^/]{1,}?)a$/u;
    match("/users/1a", re);
    match("/users/aa", re);
    match("/users/ba?key=value", re);
    match("/users/1a/", re);
    // double deslashes are dedoubled in pathnames
    match("/users//1a", re);
    match("//users//1a", re);
    match("//users//1a//", re);
    fail("/user/1a");
    fail("/users/a");
    fail("/users/aA");
    fail("/users/?a", "/users");
  });
  test.case("no params", ({ path }) => {
    path("/", {});
  });
  test.case("single param", ({ path }) => {
    path("/users/1a", { userId: "1" });
  });
  test.case("params", ({ path }) => {
    path("/users/1/comments/2", { userId: "1", commentId: "2" });
    path("/users/1/comments/2/b", { userId: 1, commentId: 2 });
  });
  test.case("single typed param", ({ path, fail }) => {
    path("/comments/1", { commentId: 1 });
    fail("/comments/ ", "/comments");
  });
  test.case("mix untyped and typed params", ({ path }) => {
    path("/users/1/comments/2/a", { userId: 1, commentId: "2" });
  });
  test.case("fail not strictly true params", ({ path }) => {
    path("/users5/1", { n: 1 });
    path("/users6/1", { nv: 1 });
  });
  test.case("different case params", ({ path }) => {
    path("/id/Id/ID", { id: "id", Id: "Id", ID: "ID" });
  });
};
