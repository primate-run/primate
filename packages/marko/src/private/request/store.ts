type Input = {
  url: string | URL;
  [key: string]: unknown;
};

type Subscriber = (value: MarkoRequest) => void;

type MarkoRequest = {
  url: URL;
  set(value: Input): void;
  subscribe(subscriber: Subscriber): () => void;
  [key: string]: unknown;
};

const subscribers = new Set<Subscriber>();

const request = {
  set(value: Input) {
    Object.assign(request, {
      ...value,
      url: value.url instanceof URL ? value.url : new URL(value.url),
    });

    for (const subscriber of subscribers) {
      subscriber(request);
    }
  },

  subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);

    return () => {
      subscribers.delete(subscriber);
    };
  },
} as MarkoRequest;

export default request;
