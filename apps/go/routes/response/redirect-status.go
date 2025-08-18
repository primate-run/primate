package main

import "github.com/primate-run/primate"

func Get(request Request) any {
  // moved permanently
  return primate.Redirect("/redirected", 301);
}
