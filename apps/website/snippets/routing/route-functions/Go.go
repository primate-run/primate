package Index

import "primate.run"

func Get(request Request) any {
  return "Hello from GET!";
}

func Post(request Request) any {
  return "Hello from POST!";
}
