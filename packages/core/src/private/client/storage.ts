const global = globalThis;

const last = -1;
const scrollTop = () => global.document.scrollingElement!.scrollTop;

export default {
  // going back in the history
  back() {
    const { next = [], old = [], stack = [] } = this.get();
    const top = stack.at(last);

    this.set({
      // place the current scrolling state in next
      next: [...next, { scrollTop: scrollTop() }],
      // add the top of the stack to old
      old: [...old, top],
      // remove top of stack
      stack: stack.slice(0, last),
    });

    return top;
  },
  // going forward in the history
  forward() {
    const { next = [], old = [], stack = [] } = this.get();

    this.set({
      // remove top of next
      next: next.slice(0, last),
      // remove top of old
      old: old.slice(0, last),
      // add the top of old to stack, with current scrollTop
      stack: [...stack, { ...old.at(last), scrollTop: scrollTop() }],
    });

    return next.at(last);
  },
  get() {
    return JSON.parse(this.storage.getItem(this.name) as any) ?? [];
  },
  name: "$$primate$$",
  // placing a new item into the history
  new(entry: any) {
    const { stack = [] } = this.get();
    this.set({
      next: [],
      // pushing a new entry invalidates all old and next items
      old: [],
      stack: [...stack, entry],
    });
  },
  peek() {
    return this.get().stack.at(last);
  },
  set(item: any) {
    this.storage.setItem(this.name, JSON.stringify(item));
  },
  storage: global.sessionStorage,
};
