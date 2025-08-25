import type SessionManager from "#session/Manager";

export default class Session<Id extends string, Data>{
  #manager: SessionManager<Id, Data>;
  #id: Id;
  #new: boolean = true;
  #data: Data = {} as Data;

  constructor(manager: SessionManager<Id, Data>, id: Id) {
    this.#id = id;
    this.#manager = manager;
  }

  get new() {
    return this.#new;
  }

  get id() {
    return this.#id;
  }

  get data() {
    return this.#data;
  }

  set data(data: Data) {
    this.#data = data;
  }

  create(data: Data) {
    this.#data = data;
    this.#new = false;
    this.#manager.create(this);
  }

  destroy() {
    this.#manager.destroy(this);
    this.#new = true;
  }
}
