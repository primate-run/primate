package main

import "github.com/primate-run/primate"

func Get(request Request) any {
  return primate.View("index.html", primate.Props{ "hello": "world" });
}
