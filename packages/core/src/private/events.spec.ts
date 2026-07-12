import events from "#events";
import test from "@rcompat/test";

test.case("events: emit and subscribe", assert => {
  const channel = events.channel<number, string>();
  const received: string[] = [];

  channel.subscribe(1, event => received.push(event));
  channel.emit(1, "one");
  channel.emit(2, "two");

  assert(received).equals(["one"]);
});

test.case("events: unsubscribe", assert => {
  const channel = events.channel<number, string>();
  const received: string[] = [];
  const unsubscribe = channel.subscribe(1, event => received.push(event));

  channel.emit(1, "one");
  unsubscribe();
  channel.emit(1, "two");

  assert(received).equals(["one"]);
});

test.case("events: safe iteration", assert => {
  const channel = events.channel<number, string>();
  const received: string[] = [];
  const unsubscribe = channel.subscribe(1, event => {
    received.push(event);
    unsubscribe();
  });
  channel.subscribe(1, event => received.push(`second:${event}`));

  channel.emit(1, "one");
  channel.emit(1, "two");

  assert(received).equals(["one", "second:one", "second:two"]);
});
