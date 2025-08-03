def get(request)
  Primate.view("Counter.jsx", { :start => 10 })
end
