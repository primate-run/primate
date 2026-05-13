function method() {
  return async () => {
    return undefined;
  };
}

function store() {
  return {
    create: method(),
    drop: method(),
    find: async () => [],
    get: method(),
    insert: method(),
    update: async () => 0,
    delete: async () => 0,
  };
}

store.key = {
  primary() { },
  foreign() { },
};
store.relation = {
  one() { },
  many() { },
  is() { },
};

export default store;
