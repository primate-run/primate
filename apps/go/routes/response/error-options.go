package main

import "github.com/primate-run/primate"

func Get(request Request) any {
  return primate.Error(primate.Props{ "body": "Go error" })
}
