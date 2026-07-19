type Message<T> = string | ((value: T) => string);
type MessageOptions<T> = Message<T> | { message?: Message<T> };

export type { MessageOptions as default };
