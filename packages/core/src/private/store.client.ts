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

export default store;
