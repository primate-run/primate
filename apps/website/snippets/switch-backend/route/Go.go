package Counter

import "primate.run"

func Get(request Request) any {
  return primate.View("Counter.jsx", primate.Props{ "start": 10 });
}
