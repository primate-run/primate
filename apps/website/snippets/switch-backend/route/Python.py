from primate import view

def get(request):
    return view("Counter.jsx", { "start" : 10 })
